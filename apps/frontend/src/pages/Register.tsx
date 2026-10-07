// --- IMPORTS ---
import { useEffect, useState } from 'react';
import { useRecoilState } from 'recoil';
import { userAtom } from '../atoms/userAtom'; // Global state for the current user
import { Link, useNavigate, useParams } from 'react-router-dom'; // Hooks for routing/navigation
import { socketAtom } from '../atoms/socketAtom'; // Global state for the WebSocket connection
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FiArrowLeft, FiCode, FiHash, FiUser, FiUsers, FiZap } from 'react-icons/fi'; // Icons for the UI
import { motion } from 'framer-motion'; // Library for smooth animations
import { GridPattern } from "../components/ui/aceternity/grid-pattern"; // UI background component

export const Register = () => {
    // --- LOCAL STATE ---
    const [name, setName] = useState<string>("");
    const [roomId, setRoomId] = useState<string>("");
    const [loading, setLoading] = useState<boolean>(false);

    // --- GLOBAL STATE (RECOIL) ---
    const [socket, setSocket] = useRecoilState<WebSocket | null>(socketAtom);
    const [user, setUser] = useRecoilState(userAtom);

    // --- ROUTER HOOKS ---
    const params = useParams();
    const navigate = useNavigate();

    function generateId() {
        const id = Math.floor(Math.random() * 100000);
        return id.toString();
    }

    const initializeSocket = (overrideRoomId?: string) => {
        if (name == "") {
            alert("Please enter a name to continue");
            return;
        }

        setLoading(true);
        const currentUserId = user.id || generateId();
        const finalRoomId = overrideRoomId !== undefined ? overrideRoomId : roomId;

        if (!socket || socket.readyState === WebSocket.CLOSED) {
            console.log("inside");

            const wsBaseUrl = import.meta.env.VITE_WEBSOCKET_SERVER_URL || `ws://${window.location.hostname}:5000`;
            const ws = new WebSocket(`${wsBaseUrl}?roomId=${finalRoomId}&id=${currentUserId}&name=${encodeURIComponent(name)}`);

            setSocket(ws);

            ws.onopen = () => {
                console.log("Connected to WebSocket");
            }

            ws.onmessage = (event) => {
                const data = JSON.parse(event.data);

                if (data.type == "roomId") {
                    setRoomId(data.roomId);
                    console.log("Room ID: ", data.roomId);

                    setUser({
                        id: currentUserId,
                        name: name,
                        roomId: data.roomId
                    });

                    setLoading(false);
                    navigate("/code/" + data.roomId);
                }
            };

            ws.onerror = (error) => {
                console.error("WebSocket Error:", error);
                alert("Failed to connect to the server. Please make sure the WebSocket server is running.");
                setLoading(false);
            };

            ws.onclose = () => {
                console.log("WebSocket connnection closed from register page");
                setLoading(false);
            }
        } else {
            setLoading(false);
        }
    }

    const handleNewRoom = () => {
        console.log("new room opened")
        if (!loading) {
            setRoomId("");
            initializeSocket("");
        }
    }

    const handleJoinRoom = () => {
        if (roomId != "" && !loading) {
            initializeSocket(roomId);
        } else {
            alert("Please enter a valid room ID");
        }
    }

    useEffect(() => {
        console.log(params.roomId)
        setRoomId(params.roomId || "");
    }, [])

    return (
        <div className="relative min-h-screen w-full overflow-hidden bg-[#F1F5F9] py-6 text-slate-800 sm:py-10">
            <GridPattern />
            <div className="pointer-events-none absolute left-[-9rem] top-[-11rem] h-[28rem] w-[28rem] rounded-full bg-cyan-400/20 blur-[120px]" />
            <div className="pointer-events-none absolute bottom-[-12rem] right-[-5rem] h-[30rem] w-[30rem] rounded-full bg-blue-500/15 blur-[130px]" />

            <div className="relative z-10 mx-auto w-full max-w-5xl px-5 sm:px-8">
                <div className="mb-10 flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-2 text-sm font-bold text-slate-500 transition hover:text-slate-900"><FiArrowLeft /> Back to home</Link>
                    <div className="flex items-center gap-2 text-sm font-extrabold tracking-tight text-slate-900">
                        <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-[#3b49df] to-[#2532a8] text-white"><FiCode /></span>
                        CoScripta
                    </div>
                </div>
                
                <div className="grid items-center gap-10 lg:grid-cols-[.85fr_1fr]">
                    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: .45 }} className="hidden lg:block">
                        <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl border border-blue-200 bg-blue-50 text-[#3b49df]"><FiZap size={23} /></div>
                        <p className="mb-4 text-xs font-bold tracking-[.16em] text-[#3b49df]">READY WHEN YOU ARE</p>
                        <h1 className="max-w-md text-5xl font-extrabold leading-[1.05] tracking-[-.05em] text-slate-900">Join the flow.<br /><span className="text-slate-500">Make progress together.</span></h1>
                        <p className="mt-6 max-w-sm text-base font-medium leading-7 text-slate-600">Open a shared space for your team in seconds. Your code, conversations, and ideas stay side by side.</p>
                        <div className="mt-10 space-y-4 border-l border-slate-300 pl-5 text-sm font-semibold text-slate-600">
                            <p className="flex items-center gap-3"><span className="h-2 w-2 rounded-full bg-cyan-500" />Live code collaboration</p>
                            <p className="flex items-center gap-3"><span className="h-2 w-2 rounded-full bg-indigo-500" />Chat, video, and whiteboard</p>
                            <p className="flex items-center gap-3"><span className="h-2 w-2 rounded-full bg-[#3b49df]" />Share a room with one code</p>
                        </div>
                    </motion.div>
                    
                    <div className="w-full max-w-md justify-self-center">
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="w-full">
                            <div className="mb-7 text-center lg:hidden">
                                <div className="mb-4 flex justify-center">
                                    <div className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-[#3b49df] to-[#2532a8] shadow-lg shadow-blue-500/30">
                                        <FiCode className="h-7 w-7 text-white" />
                                    </div>
                                </div>
                                <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Your shared workspace</h1>
                                <p className="mt-2 text-sm font-medium text-slate-500">Create a room or join your team.</p>
                            </div>

                            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xl sm:p-8">
                                <div className="mb-7 hidden lg:block">
                                    <h2 className="text-2xl font-extrabold tracking-tight text-slate-900">Enter your workspace</h2>
                                    <p className="mt-2 text-sm font-medium text-slate-500">Add your details to start collaborating.</p>
                                </div>
                                <div className="space-y-5">
                                    {/* Name Input */}
                                    <div>
                                        <label htmlFor="name" className="mb-2 block text-sm font-bold text-slate-700">Your name</label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                                <FiUser className="text-slate-400" />
                                            </div>
                                            <Input
                                                id="name"
                                                type="text"
                                                placeholder="e.g. Harshit Singh"
                                                value={name}
                                                onChange={(e) => setName(e.target.value)}
                                                className="h-12 rounded-xl border-slate-200 bg-slate-50 pl-11 font-medium text-slate-900 placeholder:text-slate-400 focus-visible:border-[#3b49df] focus-visible:ring-[#3b49df]"
                                            />
                                        </div>
                                    </div>

                                    {/* Room ID Input */}
                                    <div>
                                        <div className="mb-2 flex items-center justify-between">
                                            <label htmlFor="roomId" className="block text-sm font-bold text-slate-700">Room code</label>
                                            <span className="text-xs font-semibold text-slate-400">Optional</span>
                                        </div>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                                <FiHash className="text-slate-400" />
                                            </div>
                                            <Input
                                                id="roomId"
                                                type="text"
                                                placeholder="Paste a shared room code"
                                                value={roomId}
                                                onChange={(e) => setRoomId(e.target.value)}
                                                className="h-12 rounded-xl border-slate-200 bg-slate-50 pl-11 font-medium text-slate-900 placeholder:text-slate-400 focus-visible:border-[#3b49df] focus-visible:ring-[#3b49df]"
                                            />
                                        </div>
                                        <p className="mt-2 text-xs font-medium text-slate-500">Leave blank and we’ll create a private room for you.</p>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="space-y-3 pt-2">
                                        <Button
                                            className="h-12 w-full rounded-xl bg-gradient-to-r from-[#3b49df] to-[#2532a8] font-extrabold text-white shadow-lg shadow-blue-500/30 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-blue-500/40 flex items-center justify-center gap-2"
                                            disabled={loading || !name}
                                            onClick={handleNewRoom}
                                        >
                                            <FiCode className="h-4 w-4" />
                                            {loading ? 'Connecting...' : 'Create new room'}
                                        </Button>

                                        <Button
                                            className="h-12 w-full rounded-xl border border-slate-200 bg-white font-bold text-slate-700 transition-all duration-200 hover:border-[#3b49df] hover:text-[#3b49df] hover:bg-slate-50 flex items-center justify-center gap-2 shadow-sm"
                                            disabled={loading || !roomId || !name}
                                            onClick={handleJoinRoom}
                                        >
                                            <FiUsers className="h-4 w-4" />
                                            {loading ? 'Connecting...' : 'Join with room code'}
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
                <p className="mt-8 text-center text-xs font-semibold text-slate-500">A focused room for shared thinking and better code.</p>
            </div>
        </div>
    );
};
