import React, { useState } from 'react';
import { createProject } from '../api/projectService.ts';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FolderPlus, Settings2, Users } from 'lucide-react';

const CreateProject = () => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        try {
          const {data} = await createProject({name, description});
          navigate(`/project/${data.project._id}`);
        }catch (err: any){
            setError('Failed to create project. Please try again.');
        } finally {
            setIsLoading(false);
        }
    }

  return (
    <div className="h-full flex flex-col w-full bg-[#0E1015]">
        {/* Header */}
        <div className="px-8 pt-6 pb-4 flex items-end justify-between shrink-0 border-b border-white/[0.04]">
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-[6px] bg-[#1C1D22] border border-white/10 flex items-center justify-center shadow-sm">
                    <FolderPlus className="w-4 h-4 text-[#8A8F98]" />
                </div>
                <div>
                    <h1 className="text-[14px] font-medium text-[#E8E8FD]">New Project</h1>
                    <p className="text-[13px] text-[#8A8F98] mt-0.5">Projects let you plan and track large bodies of work.</p>
                </div>
            </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-8 py-8 custom-scrollbar">
            <div className="max-w-2xl mx-auto">
                <motion.form
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    onSubmit={handleSubmit}
                    className="space-y-8"
                >
                    {/* General Settings Section */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-[#E8E8FD] font-medium mb-6">
                            <Settings2 className="w-4 h-4 text-[#8A8F98]" />
                            <h2 className="text-[14px]">General</h2>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[12px] font-medium text-[#8A8F98] uppercase tracking-wider ml-1">Project Name</label>
                            <input
                                required
                                autoFocus
                                className="w-full bg-[#1C1D22] border border-white/[0.06] text-[#E8E8FD] text-[14px] px-4 py-2.5 rounded-lg focus:outline-none focus:border-white/20 focus:bg-[#232429] transition-all placeholder:text-[#8A8F98]"
                                placeholder="e.g. Design System Revamp"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[12px] font-medium text-[#8A8F98] uppercase tracking-wider ml-1">Description <span className="lowercase normal-case opacity-50">(Optional)</span></label>
                            <textarea
                                rows={3}
                                className="w-full bg-[#1C1D22] border border-white/[0.06] text-[#E8E8FD] text-[14px] px-4 py-2.5 rounded-lg focus:outline-none focus:border-white/20 focus:bg-[#232429] transition-all placeholder:text-[#8A8F98] resize-none"
                                placeholder="Briefly describe the goal of this project..."
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                            />
                        </div>
                    </div>

                    <hr className="border-white/[0.04]" />

                    {/* Team Section Mockup */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-[#E8E8FD] font-medium mb-6">
                            <Users className="w-4 h-4 text-[#8A8F98]" />
                            <h2 className="text-[14px]">Access</h2>
                        </div>

                        <div className="bg-[#1C1D22] border border-white/[0.06] rounded-lg p-4 flex items-center justify-between">
                            <div>
                                <h3 className="text-[13px] font-medium text-[#E8E8FD]">Workspace Access</h3>
                                <p className="text-[12px] text-[#8A8F98] mt-0.5">Everyone in the workspace can view and join this project.</p>
                            </div>
                            <button type="button" className="px-3 py-1.5 bg-white/[0.05] hover:bg-white/[0.08] text-[#E8E8FD] text-[12px] font-medium rounded transition-colors border border-white/[0.04]">
                                Change
                            </button>
                        </div>
                    </div>

                    {/* Error State */}
                    {error && (
                        <motion.div initial={{opacity: 0, y: -10}} animate={{opacity: 1, y: 0}} className="text-[#E5484D] text-[13px] bg-[#E5484D]/10 border border-[#E5484D]/20 px-3 py-2 rounded-md">
                            {error}
                        </motion.div>
                    )}

                    {/* Actions */}
                    <div className="pt-6 flex items-center justify-end gap-3">
                        <button
                            type="button"
                            onClick={() => navigate('/dashboard')}
                            className="px-4 py-2 text-[13px] font-medium text-[#8A8F98] hover:text-[#E8E8FD] transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={!name || isLoading}
                            className="flex items-center justify-center gap-2 px-4 h-[34px] min-w-[120px] bg-[#E8E8FD] hover:bg-white text-[#0E1015] text-[13px] font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                        >
                            {isLoading ? (
                                <div className="w-3.5 h-3.5 border-2 border-[#0E1015]/20 border-t-[#0E1015] rounded-full animate-spin" />
                            ) : (
                                "Create Project"
                            )}
                        </button>
                    </div>
                </motion.form>
            </div>
        </div>
    </div>
  )
}

export default CreateProject