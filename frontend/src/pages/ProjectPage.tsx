import  {useState, useEffect} from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { MoreHorizontal, Share2 } from 'lucide-react'
import KanbanBoard from '../components/KanbanBoard.tsx'
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
            setProject(data.project || data);
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
                <div className="flex items-center gap-3 text-[#8A8F98]">
                    <div className="w-4 h-4 border-2 border-white/20 border-t-[#E8E8FD] rounded-full animate-spin"></div>
                    <span className="text-[13px] font-medium tracking-wide">Loading workspace...</span>
                </div>
            </div>
        )
    }

    if (!project) {
        return (
            <div className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto">
                <div className="w-16 h-16 bg-[#1C1D22] rounded-2xl flex items-center justify-center mb-6 border border-white/[0.04]">
                    <span className="text-2xl text-[#8A8F98]">?</span>
                </div>
                <h2 className="text-xl font-semibold text-[#E8E8FD] mb-2">Project not found</h2>
                <p className="text-[13px] text-[#8A8F98] mb-6">The project you're looking for doesn't exist or you don't have access to it.</p>
                <button onClick={() => navigate('/dashboard')} className="px-4 py-2 bg-[#E8E8FD] hover:bg-white text-[#0E1015] text-[13px] font-medium rounded-md transition-colors">
                    Back to Dashboard
                </button>
            </div>
        )
    }

    return (
        <div className="h-full flex flex-col w-full bg-[#0E1015]">
            {/* Project Actions Header */}
            <div className="px-8 pt-6 pb-4 flex items-end justify-between shrink-0">
                <div>
                    <div className="flex items-center gap-2 mb-1.5">
                        <div className="w-4 h-4 rounded-[3px] bg-[#2E3038] border border-white/10 flex items-center justify-center shadow-sm">
                            <span className="text-[#E8E8FD] text-[9px] font-bold leading-none">P</span>
                        </div>
                        <span className="text-[13px] font-medium text-[#E8E8FD]">{project.name}</span>
                        <span className="text-[13px] text-[#8A8F98]">· LIN-{project._id?.substring(0, 4).toUpperCase() || 'PROJ'}</span>
                    </div>
                    {project.description && <p className="text-[13px] text-[#8A8F98] max-w-xl">{project.description}</p>}
                </div>
                <div className="flex items-center gap-3">
                    <button className="flex items-center gap-1.5 px-3 h-7 text-[13px] font-medium text-[#E8E8FD] bg-white/[0.05] border border-white/[0.04] rounded-md hover:bg-white/[0.08] transition-colors focus:outline-none">
                        <Share2 className="w-3.5 h-3.5" />
                        Share
                    </button>
                    <button className="flex items-center justify-center w-7 h-7 text-[#8A8F98] hover:text-[#E8E8FD] hover:bg-white/[0.05] rounded-md transition-colors focus:outline-none">
                        <MoreHorizontal className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>

            {/* Board Container */}
            <KanbanBoard project={project} />
        </div>
    )
}

export default ProjectPage;