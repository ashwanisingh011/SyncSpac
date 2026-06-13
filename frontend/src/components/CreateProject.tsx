import React, { useState } from 'react';
import { createProject } from '../api/projectService.ts';
import { useNavigate } from 'react-router-dom';


const CreateProject = () => {

    const [name, setName] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
          const {data} = await createProject({name});
          navigate(`/project/${data.project._id}`);
        }catch (error){
            alert("Failed to create project. Try again.");
        }

    }


  return (
    <>
    <form onSubmit={handleSubmit} className="p-8">
      <input 
        className="border p-2 w-full"
        placeholder="Project Name" 
        value={name} 
        onChange={(e) => setName(e.target.value)} 
      />
      <button className="bg-blue-600 text-white p-2 mt-2">Create Project</button>
    </form>
    </>
  )
}

export default CreateProject