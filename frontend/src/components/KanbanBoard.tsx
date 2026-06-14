import { motion } from 'framer-motion';
import { MoreHorizontal, Plus, CircleDot, CheckCircle2, Clock } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

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
        return <div className="text-[#8A8F98] p-8 text-[13px]">Loading workspace...</div>
    }

    const columnsData = [
        { id: 'todo', title: 'Todo', icon: CircleDot, iconColor: 'text-[#8A8F98]', items: project.columns.todo || [] },
        { id: 'inprogress', title: 'In Progress', icon: Clock, iconColor: 'text-[#F2C94C]', items: project.columns.inProgress || [] },
        { id: 'done', title: 'Done', icon: CheckCircle2, iconColor: 'text-[#5E6AD2]', items: project.columns.done || [] }
    ];

  return (
    <div className="flex-1 flex gap-4 overflow-x-auto pb-4 h-full px-8 select-none">
      {columnsData.map((col, index) => (
        <div
            key={col.id}
            className="flex-shrink-0 w-[320px] flex flex-col"
        >
            {/* Column Header */}
            <div className="flex items-center justify-between mb-3 h-8 group sticky top-0 bg-[#0E1015] z-10">
                <div className="flex items-center gap-2">
                    <col.icon className={cn("w-[14px] h-[14px]", col.iconColor)} />
                    <span className="font-medium text-[13px] text-[#E8E8FD]">{col.title}</span>
                    <span className="text-[12px] font-medium text-[#8A8F98] ml-1">{col.items.length}</span>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="h-6 w-6 flex items-center justify-center rounded hover:bg-white/[0.05] text-[#8A8F98] transition-colors focus:outline-none"><Plus className="w-[14px] h-[14px]" /></button>
                    <button className="h-6 w-6 flex items-center justify-center rounded hover:bg-white/[0.05] text-[#8A8F98] transition-colors focus:outline-none"><MoreHorizontal className="w-[14px] h-[14px]" /></button>
                </div>
            </div>

            {/* Cards Container */}
            <div className="flex-1 flex flex-col gap-2 overflow-y-auto pb-8 pr-1 custom-scrollbar">
                {col.items.map((task, itemIndex) => (
                    <motion.div
                        key={task._id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: (index * 0.05) + (itemIndex * 0.03), duration: 0.2 }}
                        className="group bg-[#1C1D22] border border-white/[0.04] rounded-lg p-3 cursor-pointer hover:bg-[#232429] hover:border-white/[0.08] transition-colors flex flex-col gap-2 relative shadow-sm"
                    >
                        <div className="flex items-start gap-2">
                            <div className="mt-0.5 shrink-0">
                                <col.icon className={cn("w-[14px] h-[14px]", col.iconColor)} />
                            </div>
                            <div className="flex-1 flex flex-col">
                                <div className="flex justify-between items-start mb-0.5">
                                    <span className="text-[11px] font-medium text-[#8A8F98] tracking-wide">LIN-{task._id.substring(0, 3).toUpperCase()}</span>
                                    <img className="w-4 h-4 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=64&h=64&fit=crop" alt="Assignee" />
                                </div>
                                <h3 className="text-[13px] font-medium text-[#E8E8FD] leading-snug">{task.title}</h3>
                            </div>
                        </div>

                        {/* Badges */}
                        <div className="flex items-center gap-1.5 ml-5 mt-1">
                            {task.priority === 'High' && (
                                <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-[4px] border border-white/[0.06] bg-white/[0.02] text-[#8A8F98]">
                                    <span className="w-2 h-2 rounded-full bg-[#E5484D]"></span>
                                    <span className="text-[11px] font-medium">High</span>
                                </div>
                            )}
                            {task.tag && (
                                <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-[4px] border border-white/[0.06] bg-white/[0.02] text-[#8A8F98]">
                                    <span className="text-[11px] font-medium">{task.tag}</span>
                                </div>
                            )}
                        </div>
                    </motion.div>
                ))}

                {/* Add new card button inline */}
                <button className="flex items-center gap-2 py-1.5 px-2 mt-1 text-[13px] text-[#8A8F98] hover:text-[#E8E8FD] hover:bg-white/[0.04] rounded-md transition-colors focus:outline-none">
                    <Plus className="w-[14px] h-[14px]" />
                    <span>New issue</span>
                </button>
            </div>
        </div>
      ))}
    </div>
  )
}

export default KanbanBoard;