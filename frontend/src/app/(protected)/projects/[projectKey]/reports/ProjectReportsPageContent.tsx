'use client';

import { useEffect, useState } from 'react';
import { useTaskBridgeStore } from '@/store/useTaskBridgeStore';
import { useOrganization } from '@/context/useOrganization';
import { Project } from '@/types/projects';
import { getProjectSprints } from '@/api/sprints';
import { ISprintData } from '@/types/workspace';
import {
  getSprintBurndown,
  getProjectVelocity,
  IBurndownDay,
  IVelocitySprint
} from '@/api/reports';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';
import {
  Loader2,
  TrendingUp,
  BarChart2,
  ChevronRight,
  FolderOpen,
  Calendar,
  Layers,
  CheckCircle
} from 'lucide-react';
import Link from 'next/link';

interface ProjectReportsPageContentProps {
  projectKey: string;
}

export default function ProjectReportsPageContent({ projectKey }: ProjectReportsPageContentProps) {
  const { currentOrg } = useOrganization();
  const { projects, fetchProjects, loading: storeLoading } = useTaskBridgeStore();

  const [project, setProject] = useState<Project | null>(null);
  const [loadingProject, setLoadingProject] = useState(true);

  // Sprints & Charts state
  const [sprints, setSprints] = useState<ISprintData[]>([]);
  const [selectedSprintId, setSelectedSprintId] = useState<string>('');
  const [burndownData, setBurndownData] = useState<IBurndownDay[]>([]);
  const [velocityData, setVelocityData] = useState<IVelocitySprint[]>([]);
  const [loadingBurndown, setLoadingBurndown] = useState(false);
  const [loadingVelocity, setLoadingVelocity] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // Hydration safety
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // 1. Resolve project by key
  useEffect(() => {
    const resolveProject = async () => {
      setLoadingProject(true);
      if (projects.length === 0) {
        try {
          await fetchProjects(false);
        } catch (err) {
          console.error('Failed to pre-fetch projects:', err);
        }
      }
      setLoadingProject(false);
    };

    if (currentOrg) {
      resolveProject();
    }
  }, [currentOrg, projects.length, fetchProjects]);

  // 2. Find specific project
  useEffect(() => {
    const found = projects.find((p) => p.key === projectKey);
    if (found) {
      setProject(found);
    }
  }, [projectKey, projects]);

  // 3. Load Sprints and Velocity data
  useEffect(() => {
    if (project) {
      loadSprintsAndVelocity();
    }
  }, [project]);

  // 4. Fetch burndown data when sprint changes
  useEffect(() => {
    if (selectedSprintId) {
      loadBurndown();
    } else {
      setBurndownData([]);
    }
  }, [selectedSprintId]);

  const loadSprintsAndVelocity = async () => {
    if (!project) return;
    setLoadingVelocity(true);
    try {
      // Fetch sprints
      const sprintList = await getProjectSprints(project._id);
      setSprints(sprintList);

      // Default select the active sprint, or the last sprint, or first sprint
      const activeSprint = sprintList.find((s) => s.status === 'active');
      if (activeSprint) {
        setSelectedSprintId(activeSprint._id);
      } else if (sprintList.length > 0) {
        setSelectedSprintId(sprintList[sprintList.length - 1]._id);
      }

      // Fetch velocity
      const velocityResponse = await getProjectVelocity(project._id);
      if (velocityResponse.success) {
        setVelocityData(velocityResponse.data);
      }
    } catch (err) {
      console.error('Failed to load reports base data:', err);
    } finally {
      setLoadingVelocity(false);
    }
  };

  const loadBurndown = async () => {
    if (!selectedSprintId) return;
    setLoadingBurndown(true);
    try {
      const response = await getSprintBurndown(selectedSprintId);
      if (response.success) {
        setBurndownData(response.data);
      }
    } catch (err) {
      console.error('Failed to load burndown data:', err);
    } finally {
      setLoadingBurndown(false);
    }
  };

  if (loadingProject || storeLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <p className="text-sm text-slate-500 mt-2">Loading project context...</p>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
        <FolderOpen className="w-12 h-12 text-slate-350 mb-3 animate-pulse" />
        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">Project Not Found</h3>
        <p className="text-sm text-slate-500 mt-1 max-w-sm">
          Could not resolve key <strong>{projectKey}</strong>.
        </p>
        <Link href="/projects" className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium">
          Back to Projects
        </Link>
      </div>
    );
  }

  const activeSprintInfo = sprints.find((s) => s._id === selectedSprintId);

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto w-full space-y-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
            <Link href={`/projects/${project.key}`} className="hover:underline hover:text-blue-600">{project.name}</Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-slate-700 dark:text-slate-300">Reports</span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white mt-1">
            Project Reports & Analytics
          </h1>
          <p className="text-sm text-slate-500">
            Monitor sprint progress, remaining story points, and team delivery velocity.
          </p>
        </div>
      </div>

      {/* Grid containing Burndown and Velocity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Sprint Burndown Widget (Left 2 Columns) */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                Sprint Burndown
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Tracks remaining story points vs. ideal linear progression.
              </p>
            </div>

            {/* Sprint Selector */}
            <select
              value={selectedSprintId}
              onChange={(e) => setSelectedSprintId(e.target.value)}
              className="px-3 py-1.5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-350 focus:outline-none focus:border-blue-500 transition-colors"
            >
              <option value="">-- Select Sprint --</option>
              {sprints.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.name} ({s.status})
                </option>
              ))}
            </select>
          </div>

          {/* Goal & Dates info */}
          {activeSprintInfo && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-900/55 p-3 rounded-lg text-xs">
              <div>
                <span className="text-slate-400 font-semibold block mb-0.5">Sprint Goal</span>
                <span className="font-bold text-slate-700 dark:text-slate-300">
                  {activeSprintInfo.goal || 'No goal set'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 font-semibold block mb-0.5">Duration</span>
                <span className="font-bold text-slate-700 dark:text-slate-300">
                  {activeSprintInfo.startDate && activeSprintInfo.endDate
                    ? `${new Date(activeSprintInfo.startDate).toLocaleDateString()} – ${new Date(
                        activeSprintInfo.endDate
                      ).toLocaleDateString()}`
                    : 'Not started yet'}
                </span>
              </div>
            </div>
          )}

          {/* Burndown Chart rendering */}
          <div className="h-[280px] w-full">
            {loadingBurndown ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-500">
                <Loader2 className="w-7 h-7 animate-spin text-blue-600" />
                <span className="text-xs mt-2">Computing daily progress...</span>
              </div>
            ) : burndownData.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-450 text-center">
                <BarChart2 className="w-10 h-10 text-slate-300 mb-2" />
                <span className="text-xs font-semibold">No data available for this sprint</span>
                <span className="text-[10px] text-slate-500 mt-0.5">Add tasks to this sprint and update their status to done.</span>
              </div>
            ) : (
              isMounted && (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={burndownData}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="day" tick={{ fontSize: 10 }} stroke="#94a3b8" />
                    <YAxis tick={{ fontSize: 10 }} stroke="#94a3b8" />
                    <Tooltip contentStyle={{ fontSize: 12 }} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Line
                      type="monotone"
                      dataKey="remainingPoints"
                      name="Actual Points Remaining"
                      stroke="#4f46e5"
                      strokeWidth={2.5}
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="idealPoints"
                      name="Ideal Burndown"
                      stroke="#94a3b8"
                      strokeDasharray="5 5"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )
            )}
          </div>
        </div>

        {/* Project Velocity (Right 1 Column) */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 space-y-6">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <BarChart2 className="w-5 h-5 text-indigo-600" />
              Project Velocity
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Comparison of planned vs. completed story points across sprints.
            </p>
          </div>

          <div className="h-[280px] w-full">
            {loadingVelocity ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-500">
                <Loader2 className="w-7 h-7 animate-spin text-blue-600" />
                <span className="text-xs mt-2">Compiling velocity metrics...</span>
              </div>
            ) : velocityData.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-450 text-center">
                <Layers className="w-10 h-10 text-slate-300 mb-2" />
                <span className="text-xs font-semibold">No sprint velocity history</span>
                <span className="text-[10px] text-slate-500 mt-0.5">Sprints must be started or completed to record velocity.</span>
              </div>
            ) : (
              isMounted && (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={velocityData}
                    margin={{ top: 10, right: 0, left: -20, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="sprintName" tick={{ fontSize: 10 }} stroke="#94a3b8" />
                    <YAxis tick={{ fontSize: 10 }} stroke="#94a3b8" />
                    <Tooltip contentStyle={{ fontSize: 12 }} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="planned" name="Planned" fill="#818cf8" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="completed" name="Completed" fill="#34d399" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
