import  {useState, useEffect} from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { MoreHorizontal, ArrowLeft, Share2 } from 'lucide-react'
import KanbanBoard from './KanbanBoard.tsx'
import { fetchProjectById } from '../api/projectService.ts'


const ProjectPage = () => {
    const { id } = useParams<{id: string}>();
    const navigate = useNavigate();
    const [project, setProject] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const getProject = async () => {
           try {
            const {data} = await fetchProjectById(id!);
            setProject(data);
           } catch (error) {
            console.error("Failed to fetch project:", error);
           }finally{
            setLoading(false);
           }
        };

        getProject();
    }, [id])

    if(loading) {
        return (
            <div className="h-full flex items-center justify-center">
                <div className="flex items-center gap-3 text-slate-400">
                    <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-sm font-medium tracking-wide">Loading workspace...</span>
                </div>
            </div>
        )
    }

    if (!project) {
        return (
            <div className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto">
                <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center mb-6 border border-slate-800">
                    <span className="text-2xl text-slate-500">?</span>
                </div>
                <h2 className="text-xl font-semibold text-slate-200 mb-2">Project not found</h2>
                <p className="text-slate-500 mb-6">The project you're looking for doesn't exist or you don't have access to it.</p>
                <button onClick={() => navigate('/dashboard')} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-md transition-colors">
                    Back to Dashboard
                </button>
            </div>
        )
    }

    return (
        <div className="h-full flex flex-col max-w-[1600px] mx-auto w-full">
            {/* Page Header */}
            <div className="mb-8 flex items-end justify-between shrink-0">
                <div>
                    <div className="flex items-center gap-2 mb-2 text-sm">
                        <button onClick={() => navigate('/dashboard')} className="text-slate-500 hover:text-slate-300 transition-colors focus:outline-none flex items-center gap-1">
                            <ArrowLeft className="w-3 h-3" />
                            Projects
                        </button>
                        <span className="text-slate-700">/</span>
                        <span className="text-indigo-400 font-medium">LIN-{project._id?.substring(0, 4).toUpperCase() || 'PROJ'}</span>
                    </div>
                    <h1 className="text-2xl font-semibold text-slate-100 tracking-tight">{project.name}</h1>
                    {project.description && <p className="text-slate-500 mt-1 text-sm">{project.description}</p>}
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex -space-x-2 mr-2">
                        <img className="w-7 h-7 rounded-full border-2 border-[#070a13] relative z-[3]" src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=64&h=64" alt="Team member" />
                        <img className="w-7 h-7 rounded-full border-2 border-[#070a13] relative z-[2]" src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=64&h=64" alt="Team member" />
                        <img className="w-7 h-7 rounded-full border-2 border-[#070a13] relative z-[1]" src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=64&h=64" alt="Team member" />
                    </div>
                    <button className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-300 bg-slate-900 border border-slate-800 rounded-md hover:bg-slate-800 hover:text-white transition-colors focus:outline-none">
                        <Share2 className="w-3.5 h-3.5" />
                        Share
                    </button>
                    <button className="p-1.5 text-slate-400 bg-slate-900 border border-slate-800 rounded-md hover:bg-slate-800 hover:text-white transition-colors focus:outline-none">
                        <MoreHorizontal className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Board Container */}
            <KanbanBoard project={project} />
        </div>
    )
}

export default ProjectPage;