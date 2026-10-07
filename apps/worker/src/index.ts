import { createClient } from 'redis';
import { exec } from 'child_process'
import fs from 'fs/promises'
import path from 'path'
import dotenv from 'dotenv';
import util from 'util';

const execPromise = util.promisify(exec);
dotenv.config();

// Consumer client to pull code execution jobs from the Redis List
const client = createClient({
    url: process.env.REDIS_URL,
});

// Publisher client to send execution results back to the specific room via Redis Pub/Sub
const pubClient = createClient({
    url: process.env.REDIS_URL,
});

// Helper to check if docker is available
async function isDockerAvailable(): Promise<boolean> {
    try {
        await execPromise('docker --version');
        return true;
    } catch {
        return false;
    }
}

// Helper to use Wandbox API when Docker daemon is not available (e.g. Render Node environments)
async function executeWithWandbox(code: string, language: string, input: string): Promise<string> {
    const compilerMap: Record<string, string> = {
        'javascript': 'nodejs-20.17.0',
        'python': 'cpython-3.14.0',
        'cpp': 'gcc-13.2.0',
        'go': 'go-1.23.2'
    };
    
    const compiler = compilerMap[language];
    if (!compiler) return `Error: Unsupported language for cloud sandbox: ${language}`;

    try {
        const response = await fetch('https://wandbox.org/api/compile.json', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                compiler,
                code,
                stdin: input || ""
            })
        });

        if (!response.ok) {
            return `Error: Cloud sandbox compilation failed with status ${response.status}`;
        }

        const data = await response.json();
        return data.program_error || data.program_output || data.compiler_error || data.compiler_output || "Executed successfully with no output.";
    } catch (e: any) {
        return `Error connecting to Cloud Sandbox: ${e.message}`;
    }
}

// Core function: Creates temp files, spawns an isolated Docker container for the requested language, and captures output
async function processSubmission(submission: any) {
    const { code, language, roomId, submissionId, input } = JSON.parse(submission);

    console.log(`Processing submission for room id: ${roomId}, submission id: ${submissionId}`);

    const hasDocker = await isDockerAvailable();

    if (!hasDocker) {
        console.log(`Docker not found on host. Falling back to Wandbox Cloud Sandbox for room ${roomId}`);
        const result = await executeWithWandbox(code, language, input);
        try {
            await pubClient.publish(roomId, result);
        } catch (e) {
            console.error("Failed to publish result to Redis,", e);
        }
        return;
    }

    // 1. Create a unique temporary directory for this specific job to prevent collisions
    const codeDir = path.resolve(`./tmp/user-${Date.now()}`);
    await fs.mkdir(codeDir, { recursive: true });

    let codeFilePath = "";
    let executionCommand = "";

    const inputFilePath = path.join(codeDir, "input.txt");
    const dockerPath = codeDir.replace(/\\/g, '/');

    try {
        await fs.writeFile(inputFilePath, input, "utf8");

        // 2. Write the code file and construct the Docker command based on the requested language
        // Note: The Docker containers use --network none to completely isolate the code and prevent malicious outbound requests.
        switch (language) {
            case "javascript":
                codeFilePath = path.join(codeDir, "userCode.js");
                await fs.writeFile(codeFilePath, code);
                executionCommand = `docker run --rm --memory="512m" --cpus="0.5" --network none -v "${dockerPath}:/usr/src/app" -w /usr/src/app node:18-alpine node userCode.js input.txt`;
                break;

            case "python":
                codeFilePath = path.join(codeDir, "userCode.py");
                await fs.writeFile(codeFilePath, code);
                executionCommand = `docker run --rm --memory="512m" --cpus="0.5" --network none -v "${dockerPath}:/usr/src/app" -w /usr/src/app python:3.9-alpine python userCode.py input.txt`;
                break;

            case "cpp":
                codeFilePath = path.join(codeDir, "userCode.cpp");
                await fs.writeFile(codeFilePath, code);
                executionCommand = `docker run --rm --memory="512m" --cpus="0.5" --network none -v "${dockerPath}:/usr/src/app" -w /usr/src/app gcc:latest sh -c "g++ userCode.cpp -o a.out && ./a.out < input.txt"`;
                break;

            case "go":
                codeFilePath = path.join(codeDir, "userCode.go");
                await fs.writeFile(codeFilePath, code);
                executionCommand = `docker run --rm --memory="512m" --cpus="0.5" --network none -v "${dockerPath}:/usr/src/app" -w /usr/src/app golang:1.20-alpine sh -c "go run userCode.go < input.txt"`;
                break;

            default: throw new Error("Unsupported language");
        }
    } catch (e) {
        console.error("Failed to prepare code file or Docker command", e);
        return;
    }

    // 3. Execute the Docker container with a 90-second timeout
    exec(executionCommand, { timeout: 90000 }, async (error, stdout, stderr) => {
        let result = stdout || stderr;

        if (error) {
            if (error.killed || error.signal === 'SIGTERM') {
                result = "Error: Code execution timed out (exceeded 90s limit).";
            } else {
                result = stderr || stdout || `Error: Execution failed.`;
            }
        }

        console.log(`Result for room ${roomId}: ${result}`);

        try {
            // 4. Publish the output back to the Redis room channel so the WebSocket server can broadcast it to users
            await pubClient.publish(roomId, result);
        } catch (e) {
            console.error("Failed to publish result to Redis,", e)
        }

        try {
            // 5. Clean up the temporary directory to free up disk space
            await fs.rm(codeDir, { recursive: true, force: true });
        } catch (cleanupError) {
            console.error("Failed to clean up directory:", cleanupError);
        }
    })
}

async function main() {
    while (true) {
        try {
            if (!client.isOpen) await client.connect();
            if (!pubClient.isOpen) await pubClient.connect();

            console.log("Redis Client Connected");

            while (true) {
                const { commandOptions } = require('redis');
                const submission = await client.brPop(commandOptions({ isolated: true }), "problems", 0);
                if (submission) {
                    await processSubmission(submission.element);
                }
            }
        } catch (error) {
            console.error("Failed to connect or communicating with Redis. Retrying in 5s...", error);
            await new Promise(resolve => setTimeout(resolve, 5000));
        }
    }
}

main();
