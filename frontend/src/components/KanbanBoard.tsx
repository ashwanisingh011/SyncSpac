import { motion } from 'framer-motion';
import { MoreHorizontal, Plus } from 'lucide-react';

interface Task {
  _id: string;
  title: string;
  description?: string;
  tag?: string;
  priority?: string;
}

interface Project {
  name: string;
  columns: {
    todo: Task[];
    inProgress: Task[];
    done: Task[];
  };
}

const KanbanBoard = ({project}: {project: Project}) => {
    if(!project || !project.columns){
        return <div className="text-slate-400">Loading...</div>
    }

    const columnsData = [
        { id: 'todo', title: 'Todo', items: project.columns.todo || [] },
        { id: 'inprogress', title: 'In Progress', items: project.columns.inProgress || [] },
        { id: 'done', title: 'Done', items: project.columns.done || [] }
    ];

  return (
    <div className="flex-1 flex gap-6 overflow-x-auto pb-4 h-full">
      {columnsData.map((col, index) => (
        <motion.div
            key={col.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1, duration: 0.4 }}
            className="flex-shrink-0 w-80 flex flex-col"
        >
            {/* Column Header */}
            <div className="flex items-center justify-between mb-3 px-1 group">
            <div className="flex items-center gap-2">
                <span className="font-medium text-sm text-slate-200">{col.title}</span>
                <span className="text-xs font-mono bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded-full">{col.items.length}</span>
            </div>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button className="text-slate-500 hover:text-slate-300 focus:outline-none"><Plus className="w-4 h-4" /></button>
                <button className="text-slate-500 hover:text-slate-300 focus:outline-none"><MoreHorizontal className="w-4 h-4" /></button>
            </div>
            </div>

            {/* Cards Container */}
            <div className="flex-1 flex flex-col gap-3">
            {col.items.map((task, itemIndex) => (
                <motion.div
                key={task._id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: (index * 0.1) + (itemIndex * 0.05), duration: 0.3 }}
                className="group bg-slate-900/50 border border-slate-800/80 rounded-lg p-4 cursor-pointer hover:bg-slate-900 hover:border-slate-700 transition-all hover:shadow-lg hover:shadow-black/20"
                >
                <div className="flex justify-between items-start mb-2">
                    <span className="text-[10px] font-mono font-semibold text-slate-500 tracking-wider">LIN-{task._id.substring(0, 4).toUpperCase()}</span>
                    <img className="w-5 h-5 rounded-full" src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=64&h=64" alt="Assignee" />
                </div>
                <h3 className="text-sm font-medium text-slate-200 mb-1 leading-snug group-hover:text-indigo-400 transition-colors">{task.title}</h3>
                {task.description && <p className="text-xs text-slate-500 line-clamp-2 mb-3 leading-relaxed">{task.description}</p>}

                <div className="flex items-center gap-2 mt-auto">
                    <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    {task.tag || 'Task'}
                    </span>
                    {task.priority === 'High' && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-red-500/10 text-red-400 border border-red-500/20">
                        High Priority
                    </span>
                    )}
                </div>
                </motion.div>
            ))}

            {/* Add new card button */}
            <button className="flex items-center gap-2 py-2 px-3 text-sm text-slate-500 hover:text-slate-300 hover:bg-slate-900/50 rounded-lg transition-colors border border-transparent border-dashed hover:border-slate-700 focus:outline-none">
                <Plus className="w-4 h-4" />
                New Issue
            </button>
            </div>
        </motion.div>
        ))}
    </div>
  )
}

export default KanbanBoard;
