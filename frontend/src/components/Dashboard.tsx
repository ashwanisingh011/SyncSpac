import {useState, useEffect} from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'


const Dashboard = () => {

    const [projects, setProjects] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        axios.get('http://localhost:5001/api/projects', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        }).then(res => setProjects(res.data))
    }, [])

  return (
    <>
        <div>
            <h1>Dashboard</h1>
            {projects.map((p: any) => (
                <button key={p._id} onClick={() => navigate(`/project/${p._id}`)}>
                    {p.name}
                </button>
            ))}
        </div>
    </>
  )
}

export default Dashboard