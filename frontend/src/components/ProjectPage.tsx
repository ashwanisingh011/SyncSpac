import  {useState, useEffect} from 'react'
import { useParams } from 'react-router-dom'
import KanbanBoard from './KanbanBoard.tsx'
import { fetchProjectById } from '../api/projectService.ts'


const ProjectPage = () => {
    const { id } = useParams<{id: string}>();
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

    if(loading) return <div>Loading...</div>

    return (
        <>
            <div className="p-8">
                <h1 className="text-2xl font-bold mb-4">{project.name}</h1>
                <KanbanBoard project={project} />
            </div>
        </>
    )
}

export default ProjectPage;