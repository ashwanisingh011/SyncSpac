import axios from 'axios'

const API = axios.create({baseURL: 'http://localhost:5001/api'})

API.interceptors.request.use((req) => {
    const token = localStorage.getItem('token');
    if(token){
        req.headers.Authorization = `Bearer ${token}`;
    }
     return req;
       
});


export const createProject = (projectData: any) => API.post('/project', projectData);
export const fetchProjectById = (id: string) => API.get(`/project/${id}`)
export const fetchAllProjects = () => API.get('/project');
export const fetchWorkspaceProjects = (workspaceId: string) => API.get(`/workspaces/${workspaceId}/projects`);