import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, Folder, PlusSquare, User, LogOut, Search, Code, Code2 } from 'lucide-react';

export const Dashboard = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [projectName, setProjectName] = useState('');
  const [projectLanguage, setProjectLanguage] = useState('JavaScript');
  const [activeTab, setActiveTab] = useState('dashboard');
  
  const [projects, setProjects] = useState([
    { id: 1, name: 'WebApp', language: 'JavaScript', members: 3 },
    { id: 2, name: 'DataAnalyzer', language: 'Python', members: 2 },
    { id: 3, name: 'ChatBot', language: 'JavaScript', members: 1 },
  ]);

  const projectNameInputRef = useRef<HTMLInputElement>(null);

  const handleFocusCreate = () => {
    setActiveTab('create');
    projectNameInputRef.current?.focus();
  };

  const handleLogout = () => {
    navigate('/');
  };

  const handleCreateProject = () => {
    if (projectName.trim()) {
      setProjects([
        ...projects,
        {
          id: projects.length + 1,
          name: projectName,
          language: projectLanguage,
          members: 1,
        }
      ]);
      setProjectName('');
      setActiveTab('dashboard');
    }
  };

  const filteredProjects = projects.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-800 font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-white flex flex-col justify-between border-r border-slate-200">
        <div>
          {/* Logo */}
          <div className="flex items-center gap-3 p-6 mb-4">
            <span className="text-[#3b49df] font-black text-2xl tracking-tighter">&lt;/&gt;</span>
            <span className="text-xl font-extrabold text-slate-900 tracking-tight">CoScripta</span>
          </div>

          {/* Navigation */}
          <nav className="px-4 space-y-1">
            <button 
              onClick={() => setActiveTab('dashboard')}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all ${activeTab === 'dashboard' ? 'bg-[#3b49df] text-white shadow-md shadow-[#3b49df]/20' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'}`}
            >
              <Home className="w-4 h-4" />
              <span>Dashboard</span>
            </button>
            <button 
              onClick={() => setActiveTab('projects')}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all ${activeTab === 'projects' ? 'bg-[#3b49df] text-white shadow-md shadow-[#3b49df]/20' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'}`}
            >
              <Folder className="w-4 h-4" />
              <span>My Projects</span>
            </button>
            <button 
              onClick={handleFocusCreate}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all ${activeTab === 'create' ? 'bg-[#3b49df] text-white shadow-md shadow-[#3b49df]/20' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'}`}
            >
              <PlusSquare className="w-4 h-4" />
              <span>Create Project</span>
            </button>
            <button 
              onClick={() => setActiveTab('profile')}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all ${activeTab === 'profile' ? 'bg-[#3b49df] text-white shadow-md shadow-[#3b49df]/20' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'}`}
            >
              <User className="w-4 h-4" />
              <span>Profile</span>
            </button>
          </nav>
        </div>

        {/* Logout */}
        <div className="p-4">
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-slate-600 hover:text-rose-600 hover:bg-rose-50 font-semibold text-sm transition-colors">
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-y-auto">
        {/* Header */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
              Hello, JohnDoe <span className="text-xl">👋</span>
            </h1>
            <p className="text-sm font-medium text-slate-500 mt-1">Here are your projects</p>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search projects..."
                className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#3b49df] focus:ring-1 focus:ring-[#3b49df] transition-all w-64 shadow-sm"
              />
            </div>
            <button onClick={handleFocusCreate} className="bg-[#3b49df] hover:bg-[#323ec0] text-white px-5 py-2 rounded-xl text-sm font-semibold transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5">
              Create Project
            </button>
            <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-[#3b49df] font-bold text-sm shadow-sm cursor-pointer ml-2 border border-indigo-200">
              JD
            </div>
          </div>
        </header>

        {activeTab === 'profile' ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-8 max-w-2xl shadow-sm">
            <h2 className="text-xl font-extrabold text-slate-900 mb-6">User Profile</h2>
            <div className="flex items-center gap-6 mb-8">
              <div className="w-20 h-20 rounded-full bg-indigo-50 flex items-center justify-center text-[#3b49df] border border-indigo-100 font-bold text-3xl shadow-sm">
                JD
              </div>
              <div>
                <h3 className="text-2xl font-extrabold text-slate-900">John Doe</h3>
                <p className="text-slate-500 font-medium mt-1">Software Engineer</p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Email</label>
                <input type="email" value="johndoe@example.com" readOnly className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-800 font-medium focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Username</label>
                <input type="text" value="@johndoe" readOnly className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-800 font-medium focus:outline-none" />
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Create Project Bar (Visible on Dashboard, My Projects, Create) */}
            {(activeTab === 'dashboard' || activeTab === 'create') && (
              <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row gap-4 items-center mb-8 shadow-sm">
                <input
                  ref={projectNameInputRef}
                  type="text"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="Project name"
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 font-medium focus:outline-none focus:border-[#3b49df] transition-colors w-full"
                />
                <div className="relative w-full sm:w-48">
                  <select
                    value={projectLanguage}
                    onChange={(e) => setProjectLanguage(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-800 appearance-none focus:outline-none focus:border-[#3b49df] cursor-pointer"
                  >
                    <option value="JavaScript">JavaScript</option>
                    <option value="Python">Python</option>
                    <option value="TypeScript">TypeScript</option>
                    <option value="C++">C++</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                  </div>
                </div>
                <button 
                  onClick={handleCreateProject}
                  className="w-full sm:w-auto bg-[#3b49df] hover:bg-[#323ec0] text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 whitespace-nowrap"
                >
                  Create
                </button>
              </div>
            )}

            {/* Projects List (Visible on Dashboard, My Projects) */}
            {(activeTab === 'dashboard' || activeTab === 'projects') && (
              <div>
                <h2 className="text-lg font-extrabold text-slate-900 mb-5">Your Projects</h2>
                <div className="space-y-3.5">
                  {filteredProjects.map((project) => (
                    <div key={project.id} className="bg-white border border-slate-200 rounded-2xl p-5 flex items-center justify-between hover:border-[#3b49df]/30 hover:shadow-md transition-all group">
                      <div className="flex items-center gap-4">
                        <div className="w-11 h-11 rounded-xl bg-indigo-50 flex items-center justify-center text-[#3b49df] border border-indigo-100">
                          <Code className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="text-sm font-extrabold text-slate-900">{project.name}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[11px] font-bold text-slate-500">{project.language}</span>
                            <span className="text-slate-300 text-[10px]">•</span>
                            <span className="text-[11px] font-bold text-slate-500">{project.members} {project.members === 1 ? 'member' : 'members'}</span>
                          </div>
                        </div>
                      </div>
                      
                      <button 
                        onClick={() => navigate(`/code/${project.id}`)}
                        className="bg-indigo-50 hover:bg-[#3b49df] text-[#3b49df] hover:text-white border border-indigo-100 px-5 py-2 rounded-xl text-xs font-bold transition-all opacity-90 group-hover:opacity-100"
                      >
                        Open
                      </button>
                    </div>
                  ))}
                  
                  {filteredProjects.length === 0 && (
                    <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 shadow-sm">
                      <Code2 className="w-10 h-10 text-slate-300 mx-auto mb-4" />
                      <p className="text-slate-500 font-medium text-sm">No projects found matching your search.</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
};
