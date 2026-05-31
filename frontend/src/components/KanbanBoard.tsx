
function KanbanBoard({project}) {
    if(!project){
        return <div>Loading...</div>
    }
  return (
    <div className="grid grid-cols-3 gap-4">
      {/* Todo Column */}
      <div className="bg-gray-100 p-4 rounded">
        <h2 className="font-bold">Todo</h2>
        {project.columns.todo.map((task: any) => (
            <div key={task._id} className='bg-white p-3 my-2 shadow rounded border-l-4 border-blue-500'>
                {task.title}
            </div>
        ))}
      </div>

      {/* In Progress Column */}
      <div className="bg-gray-100 p-4 rounded">
        <h2 className="font-bold">In Progress</h2>
        {project.columns.inProgress.map((task: any) => (
           <div key={task._id} className="bg-white p-3 my-2 shadow rounded border-l-4 border-yellow-500">
             {task.title}
           </div>
        ))}
      </div>

      {/* Done Column */}
      <div className="bg-gray-100 p-4 rounded">
        <h2 className="font-bold">Done</h2>
        {project.columns.done.map((task: any) => (
            <div key={task._id} className="bg-white p-3 my-2 shadow rounded border-l-4 border-green-500">
              {task.title}
            </div>  
        ))}
      </div>
    </div>
  )
}

export default KanbanBoard