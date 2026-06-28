import {useState, useEffect} from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchAllProjects } from '../api/projectService'  
import { Plus, MoreHorizontal, LayoutGrid, List } from 'lucide-react'

const Dashboard = () => {

    const [projects, setProjects] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
    const navigate = useNavigate();

    
    useEffect(() => {
       fetchAllProjects().then(res => {
        setProjects(res.data.projects || res.data);
       })
       .catch(err => console.error('Error fetching projects:', err))
       .finally(() => setIsLoading(false));
    }, [])

  return (
    <div className="h-full flex flex-col w-full bg-[#0E1015]">
        {/* Project List Actions */}
        <div className="px-8 pt-6 pb-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-[4px] bg-[#2E3038] border border-white/10 flex items-center justify-center shadow-sm">
                <span className="text-[#E8E8FD] text-[11px] font-bold">P</span>
            </div>
            <h1 className="text-[14px] font-medium text-[#E8E8FD]">Projects</h1>
          </div>
          <div className="flex items-center gap-2">

            {/* View Toggle */}
            <div className="flex items-center bg-[#1C1D22] border border-white/[0.04] rounded-md p-0.5 mr-2">
                <button
                    onClick={() => setViewMode('list')}
                    className={`p-1 rounded-[4px] transition-colors ${viewMode === 'list' ? 'bg-[#2E3038] text-[#E8E8FD]' : 'text-[#8A8F98] hover:text-[#E8E8FD]'}`}
                >
                    <List className="w-[14px] h-[14px]" />
                </button>
                <button
                    onClick={() => setViewMode('grid')}
                    className={`p-1 rounded-[4px] transition-colors ${viewMode === 'grid' ? 'bg-[#2E3038] text-[#E8E8FD]' : 'text-[#8A8F98] hover:text-[#E8E8FD]'}`}
                >
                    <LayoutGrid className="w-[14px] h-[14px]" />
                </button>
            </div>

            <button onClick={() => navigate('/project')} className="flex items-center gap-1.5 px-3 h-7 bg-[#E8E8FD] hover:bg-white text-[#0E1015] text-[13px] font-medium rounded-md transition-colors focus:outline-none shadow-sm">
              <Plus className="w-[14px] h-[14px]" />
              New Project
            </button>
          </div>
        </div>

        {/* Project List */}
        <div className="flex-1 overflow-y-auto px-8 py-6 custom-scrollbar">

            {/* List Header */}
            {projects.length > 0 && viewMode === 'list' && (
                <div className="flex items-center px-4 py-2 mb-2 text-[12px] font-medium text-[#8A8F98] border-b border-white/[0.04]">
                    <div className="w-8"></div>
                    <div className="flex-1">Project</div>
                    <div className="w-32">Status</div>
                    <div className="w-32">Lead</div>
                    <div className="w-32 text-right">Updated</div>
                    <div className="w-10"></div>
                </div>
            )}

            <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" : "flex flex-col gap-1"}>
                {projects.map((p: any) => (
                    viewMode === 'list' ? (
                        /* Linear List Row */
                        <div
                            key={p._id}
                            onClick={() => navigate(`/project/${p._id}`)}
                            className="group flex items-center px-4 h-12 bg-transparent hover:bg-white/[0.03] rounded-lg cursor-pointer transition-colors border border-transparent hover:border-white/[0.04]"
                        >
                            <div className="w-8 flex items-center justify-center">
                                <div className="w-2.5 h-2.5 rounded-full border-2 border-[#E8E8FD]"></div>
                            </div>
                            <div className="flex-1 flex items-center gap-3">
                                <span className="text-[13px] font-medium text-[#E8E8FD]">{p.name}</span>
                            </div>
                            <div className="w-32 flex items-center">
                                <span className="text-[12px] text-[#8A8F98] bg-white/[0.04] px-2 py-0.5 rounded border border-white/[0.04]">Planned</span>
                            </div>
                            <div className="w-32 flex items-center gap-2">
                                <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=64&h=64&fit=crop" className="w-4 h-4 rounded-full" alt="Lead" />
                                <span className="text-[13px] text-[#8A8F98]">Jane Doe</span>
                            </div>
                            <div className="w-32 text-right">
                                <span className="text-[12px] text-[#8A8F98]">2d ago</span>
                            </div>
                            <div className="w-10 flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                                <button className="p-1 text-[#8A8F98] hover:text-[#E8E8FD] transition-colors"><MoreHorizontal className="w-[14px] h-[14px]" /></button>
                            </div>
                        </div>
                    ) : (
                        /* Grid Card Fallback */
                        <div
                            key={p._id}
                            onClick={() => navigate(`/project/${p._id}`)}
                            className="group flex flex-col p-4 bg-[#1C1D22] border border-white/[0.04] hover:border-white/[0.08] hover:bg-[#232429] rounded-xl cursor-pointer transition-colors shadow-sm min-h-[140px]"
                        >
                            <div className="flex items-start justify-between mb-3">
                                <div className="w-8 h-8 rounded-lg bg-white/[0.04] flex items-center justify-center border border-white/[0.02]">
                                    <div className="w-2.5 h-2.5 rounded-full border-2 border-[#E8E8FD]"></div>
                                </div>
                                <button className="opacity-0 group-hover:opacity-100 p-1 text-[#8A8F98] hover:text-[#E8E8FD] transition-all"><MoreHorizontal className="w-[14px] h-[14px]" /></button>
                            </div>
                            <h3 className="text-[14px] font-medium text-[#E8E8FD] mb-1">{p.name}</h3>
                            <p className="text-[13px] text-[#8A8F98] line-clamp-2 leading-relaxed flex-1">{p.description || 'No description provided.'}</p>

                            <div className="mt-4 pt-3 border-t border-white/[0.04] flex items-center justify-between">
                                <span className="text-[12px] text-[#8A8F98] bg-white/[0.04] px-2 py-0.5 rounded border border-white/[0.04]">Planned</span>
                                <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=64&h=64&fit=crop" className="w-5 h-5 rounded-full border border-black/50" alt="Lead" />
                            </div>
                        </div>
                    )
                ))}
            </div>

            {projects.length === 0 && (
                <div className="py-20 flex flex-col items-center justify-center text-center">
                    <div className="w-12 h-12 rounded-full bg-white/[0.02] border border-white/[0.04] flex items-center justify-center text-[#8A8F98] mb-4">
                        <Plus className="w-5 h-5" />
                    </div>
                    <h3 className="text-[#E8E8FD] font-medium text-[14px] mb-1">Create a project</h3>
                    <p className="text-[#8A8F98] text-[13px] mb-4 max-w-sm">Projects let you plan and track large bodies of work across teams.</p>
                    <button onClick={() => navigate('/project')} className="flex items-center gap-1.5 px-3 h-7 bg-white/[0.05] hover:bg-white/[0.08] border border-white/[0.04] text-[#E8E8FD] text-[13px] font-medium rounded-md transition-colors focus:outline-none">
                        New Project
                    </button>
                </div>
            )}
        </div>
    </div>
  )
}

export default Dashboard;