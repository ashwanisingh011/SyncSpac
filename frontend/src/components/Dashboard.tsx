import {useState, useEffect} from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { motion } from 'framer-motion'
import { Folder, MoreHorizontal, Plus, Star } from 'lucide-react'


const Dashboard = () => {

    const [projects, setProjects] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        axios.get('http://localhost:5001/api/projects', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        }).then(res => setProjects(res.data)).catch(err => console.error("Failed to fetch projects", err));
    }, [])

  return (
    <div className="h-full flex flex-col max-w-5xl mx-auto w-full">
        {/* Page Header */}
        <div className="mb-8 flex items-end justify-between shrink-0">
          <div>
            <h1 className="text-2xl font-semibold text-slate-100 tracking-tight">Your Projects</h1>
            <p className="text-slate-500 mt-1 text-sm">Select a project to view its kanban board and tasks.</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/project')} className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-md tracking-wide transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-600/50 shadow-sm shadow-indigo-600/20">
              <Plus className="w-4 h-4" />
              New Project
            </button>
          </div>
        </div>

        {/* Project List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((p: any, index: number) => (
                <motion.div
                    key={p._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05, duration: 0.3 }}
                    onClick={() => navigate(`/project/${p._id}`)}
                    className="group bg-slate-900/40 border border-slate-800/60 rounded-xl p-5 cursor-pointer hover:bg-slate-900/80 hover:border-slate-700 transition-all hover:shadow-lg hover:shadow-black/20 flex flex-col"
                >
                    <div className="flex justify-between items-start mb-4">
                        <div className="w-10 h-10 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 group-hover:bg-indigo-500/20 transition-colors">
                            <Folder className="w-5 h-5" />
                        </div>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button className="p-1.5 text-slate-500 hover:text-slate-300 rounded hover:bg-slate-800 transition-colors focus:outline-none" onClick={(e) => { e.stopPropagation(); }}>
                                <Star className="w-4 h-4" />
                            </button>
                            <button className="p-1.5 text-slate-500 hover:text-slate-300 rounded hover:bg-slate-800 transition-colors focus:outline-none" onClick={(e) => { e.stopPropagation(); }}>
                                <MoreHorizontal className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    <h3 className="text-base font-medium text-slate-200 mb-1 group-hover:text-indigo-400 transition-colors">{p.name}</h3>
                    <p className="text-sm text-slate-500 line-clamp-2 mb-4 leading-relaxed">{p.description || 'No description provided for this project.'}</p>

                    <div className="mt-auto pt-4 border-t border-slate-800/60 flex items-center justify-between">
                        <div className="flex -space-x-2">
                            <img className="w-6 h-6 rounded-full border-2 border-slate-900 relative z-[2]" src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=64&h=64" alt="Team member" />
                            <img className="w-6 h-6 rounded-full border-2 border-slate-900 relative z-[1]" src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=64&h=64" alt="Team member" />
                        </div>
                        <span className="text-xs font-medium text-slate-500">Updated 2d ago</span>
                    </div>
                </motion.div>
            ))}

            {projects.length === 0 && (
                <div className="col-span-full py-12 flex flex-col items-center justify-center text-center border border-dashed border-slate-800 rounded-xl bg-slate-900/20">
                    <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 mb-4">
                        <Folder className="w-6 h-6" />
                    </div>
                    <h3 className="text-slate-200 font-medium mb-1">No projects found</h3>
                    <p className="text-slate-500 text-sm mb-4">Get started by creating a new project workspace.</p>
                    <button onClick={() => navigate('/project')} className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium rounded-md transition-colors focus:outline-none">
                        <Plus className="w-4 h-4" />
                        Create Project
                    </button>
                </div>
            )}
        </div>
    </div>
  )
}

export default Dashboard;