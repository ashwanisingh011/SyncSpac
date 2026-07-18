'use client';

import { useSuperAdmin } from '@/context/superadminContext';
import { useState, useEffect } from 'react';
import {
  Users as UsersIcon,
  Loader2,
  Eye,
  ShieldAlert,
  ShieldCheck,
  Search,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

export default function SuperAdminUsersPage() {
  const {
    usersList,
    orgsList,
    loading,
    error,
    actionLoadingId,
    setSelectedUser,
    handleToggleBanUser,
    userSearch,
    setUserSearch,
    userRoleFilter,
    setUserRoleFilter,
    userStatusFilter,
    setUserStatusFilter,
    userOrgFilter,
    setUserOrgFilter,
  } = useSuperAdmin();

  // Local state for organization name search
  const [orgSearchInput, setOrgSearchInput] = useState('');

  // Pagination page tracker per organization ID
  const [pages, setPages] = useState<{ [orgId: string]: number }>({});
  const ITEMS_PER_PAGE = 5;

  // Reset pagination when any filter or search changes
  useEffect(() => {
    setPages({});
  }, [userSearch, userRoleFilter, userStatusFilter, userOrgFilter, orgSearchInput]);

  // Group users by organization
  const grouped: { [orgId: string]: { orgName: string; users: any[] } } = {};

  // Initialize from orgsList
  orgsList.forEach((org) => {
    // Filter by organization dropdown selection
    if (userOrgFilter && userOrgFilter !== org.id) return;

    // Filter by organization name search
    if (orgSearchInput && !org.name.toLowerCase().includes(orgSearchInput.toLowerCase())) return;

    grouped[org.id] = {
      orgName: org.name,
      users: [],
    };
  });

  // Handle "No Workspace" group
  const showNoWorkspace =
    (!userOrgFilter || userOrgFilter === 'no_workspace') &&
    (!orgSearchInput ||
      'no workspace'.includes(orgSearchInput.toLowerCase()) ||
      'independent'.includes(orgSearchInput.toLowerCase()));

  if (showNoWorkspace) {
    grouped['no_workspace'] = {
      orgName: 'No Workspace / Independent',
      users: [],
    };
  }

  // Populate users into groups
  usersList.forEach((usr) => {
    const targetOrgId = usr.orgId || 'no_workspace';
    if (grouped[targetOrgId]) {
      grouped[targetOrgId].users.push(usr);
    }
  });

  // Filter groups: if any user-specific filter is active, only show groups with users
  const hasUserFilter = userSearch || userRoleFilter || userStatusFilter;
  const finalGroups = Object.entries(grouped)
    .map(([orgId, data]) => ({
      orgId,
      orgName: data.orgName,
      users: data.users,
      totalCount: data.users.length,
    }))
    .filter((group) => {
      if (hasUserFilter) {
        return group.users.length > 0;
      }
      return true;
    });

  return (
    <div className="space-y-6">
      {/* Top Filter Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-4 animate-fadeIn">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <UsersIcon className="w-5 h-5 text-blue-600" />
            <h2 className="text-base font-bold text-slate-800 dark:text-white">Platform Users</h2>
          </div>
        </div>

        {/* Filters grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
          {/* Search by User Name */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-3" />
            <input
              type="text"
              placeholder="Search user name..."
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              className="text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg pl-8 pr-3 py-2.5 outline-none focus:border-blue-500 w-full"
            />
          </div>

          {/* Search by Organization Name */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-3" />
            <input
              type="text"
              placeholder="Search organization..."
              value={orgSearchInput}
              onChange={(e) => setOrgSearchInput(e.target.value)}
              className="text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg pl-8 pr-3 py-2.5 outline-none focus:border-blue-500 w-full"
            />
          </div>

          {/* Filter by Organization Dropdown */}
          <select
            value={userOrgFilter}
            onChange={(e) => setUserOrgFilter(e.target.value)}
            className="text-xs bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-lg px-2 py-2.5 outline-none w-full text-slate-700 dark:text-slate-300"
          >
            <option value="">All Organizations</option>
            <option value="no_workspace">No Workspace</option>
            {orgsList.map((org) => (
              <option key={org.id} value={org.id}>
                {org.name}
              </option>
            ))}
          </select>

          {/* Filter by Role */}
          <select
            value={userRoleFilter}
            onChange={(e) => setUserRoleFilter(e.target.value)}
            className="text-xs bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-lg px-2 py-2.5 outline-none w-full text-slate-700 dark:text-slate-300"
          >
            <option value="">All Roles</option>
            <option value="org_admin">Org Admin</option>
            <option value="project_manager">Project Manager</option>
            <option value="team_lead">Team Lead</option>
            <option value="developer">Developer</option>
            <option value="qa_tester">QA Tester</option>
            <option value="member">Member</option>
          </select>

          {/* Filter by Status */}
          <select
            value={userStatusFilter}
            onChange={(e) => setUserStatusFilter(e.target.value)}
            className="text-xs bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-lg px-2 py-2.5 outline-none w-full text-slate-700 dark:text-slate-300"
          >
            <option value="">All Statuses</option>
            <option value="true">Active Only</option>
            <option value="false">Banned Only</option>
          </select>
        </div>
      </div>

      {/* Main Content Area */}
      {error && (
        <div className="bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/50 rounded-xl p-4 text-red-655 dark:text-red-400 text-xs">
          {error}
        </div>
      )}

      {loading && usersList.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-slate-500 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl shadow-sm">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-2" />
          <span className="text-xs">Retrieving platform users organized by workspace...</span>
        </div>
      ) : finalGroups.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-slate-500 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl shadow-sm">
          <UsersIcon className="w-10 h-10 text-slate-300 dark:text-slate-700 mb-2" />
          <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">No organizations or users match your query.</span>
          <span className="text-xs text-slate-400">Try adjusting your filters or search terms.</span>
        </div>
      ) : (
        <div className="space-y-6">
          {finalGroups.map((group) => {
            const currentPage = pages[group.orgId] || 1;
            const totalPages = Math.ceil(group.users.length / ITEMS_PER_PAGE);
            const paginatedUsers = group.users.slice(
              (currentPage - 1) * ITEMS_PER_PAGE,
              currentPage * ITEMS_PER_PAGE
            );

            return (
              <div
                key={group.orgId}
                className="bg-transparent sm:bg-white dark:bg-slate-900 border-transparent sm:border sm:border-slate-100 sm:dark:border-slate-800 rounded-xl p-0 sm:p-5 shadow-none sm:shadow-sm space-y-4"
              >
                {/* Organization Header */}
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mt-4 sm:mt-0 px-1 sm:px-0">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse"></span>
                    <h3 className="text-sm font-bold text-slate-800 dark:text-white">
                      {group.orgName}
                    </h3>
                  </div>
                  <span className="bg-slate-50 dark:bg-slate-805 text-slate-600 dark:text-slate-350 text-xs px-2.5 py-1 rounded-full font-semibold border border-slate-100 dark:border-slate-750">
                    Total Users: {group.totalCount}
                  </span>
                </div>

                {/* Users Table / Cards */}
                {group.users.length === 0 ? (
                  <div className="py-6 text-center text-slate-400 text-xs italic">
                    No users in this organization matching the criteria.
                  </div>
                ) : (
                  <>
                    {/* Desktop View Table */}
                    <div className="hidden sm:block overflow-x-auto">
                      <table className="w-full text-left text-sm">
                        <thead>
                          <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 dark:text-slate-500 uppercase font-black text-[10px] tracking-wider">
                            <th className="px-4 py-2">User</th>
                            <th className="px-4 py-2">Role</th>
                            <th className="px-4 py-2">Joined On</th>
                            <th className="px-4 py-2">Status</th>
                            <th className="px-4 py-2 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                          {paginatedUsers.map((usr) => (
                            <tr
                              key={usr.id}
                              className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10"
                            >
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2.5">
                                  <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-slate-800 text-blue-650 dark:text-blue-400 flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden">
                                    {usr.avatar ? (
                                      <img
                                        src={usr.avatar}
                                        alt=""
                                        className="w-full h-full object-cover"
                                      />
                                    ) : (
                                      usr.name.substring(0, 2).toUpperCase()
                                    )}
                                  </div>
                                  <div>
                                    <span className="font-semibold text-slate-800 dark:text-slate-200 block leading-tight">
                                      {usr.name}
                                    </span>
                                    <span className="text-xs text-slate-450">{usr.email}</span>
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-3 font-medium capitalize text-slate-655 dark:text-slate-400 text-xs">
                                {usr.roleLabel || usr.role}
                              </td>
                              <td className="px-4 py-3 text-xs text-slate-500 dark:text-slate-450">
                                {new Date(usr.createdAt).toLocaleDateString()}
                              </td>
                              <td className="px-4 py-3">
                                <span
                                  className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${usr.status === 'active'
                                      ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-450'
                                      : 'bg-red-50 text-red-655 dark:bg-red-950/20 dark:text-red-400'
                                    }`}
                                >
                                  {usr.status === 'active' ? 'Active' : 'Banned'}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-right shrink-0">
                                <button
                                  onClick={() => setSelectedUser(usr)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 hover:bg-slate-50 dark:hover:bg-slate-850 text-slate-600 dark:text-slate-350 cursor-pointer"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                  View
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Mobile View Cards */}
                    <div className="block sm:hidden space-y-4 mt-2">
                      {paginatedUsers.map((usr) => (
                        <div
                          key={usr.id}
                          className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl p-4 space-y-4 shadow-sm"
                        >
                          {/* User Info Row */}
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-full bg-blue-105 dark:bg-slate-800 text-blue-650 dark:text-blue-400 flex items-center justify-center font-bold text-sm shrink-0 overflow-hidden">
                              {usr.avatar ? (
                                <img
                                  src={usr.avatar}
                                  alt=""
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                usr.name.substring(0, 2).toUpperCase()
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <span className="font-semibold text-slate-800 dark:text-slate-200 block text-sm leading-tight truncate">
                                {usr.name}
                              </span>
                              <span className="text-xs text-slate-450 block truncate mt-0.5">{usr.email}</span>
                            </div>
                          </div>

                          {/* Role, Status & Joined Row */}
                          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
                            <div>
                              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Role</span>
                              <span className="font-medium capitalize text-slate-655 dark:text-slate-300 block mt-0.5">
                                {usr.roleLabel || usr.role}
                              </span>
                            </div>

                            <div>
                              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Joined On</span>
                              <span className="text-slate-500 dark:text-slate-400 block mt-0.5">
                                {new Date(usr.createdAt).toLocaleDateString()}
                              </span>
                            </div>

                            <div>
                              <span className="text-slate-400 block text-[10px] uppercase font-semibold mb-0.5">Status</span>
                              <span
                                className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${usr.status === 'active'
                                    ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-450'
                                    : 'bg-red-50 text-red-655 dark:bg-red-950/20 dark:text-red-400'
                                  }`}
                              >
                                {usr.status === 'active' ? 'Active' : 'Banned'}
                              </span>
                            </div>
                          </div>

                          {/* Actions Button Bar */}
                          <div className="flex items-center justify-end pt-1">
                            <button
                              onClick={() => setSelectedUser(usr)}
                              className="inline-flex items-center justify-center gap-1 px-3 py-2 rounded-lg text-xs font-semibold border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 hover:bg-slate-50 dark:hover:bg-slate-850 text-slate-600 dark:text-slate-350 cursor-pointer w-full"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              View
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                      <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-3">
                        <span className="text-xs text-slate-400">
                          Showing{' '}
                          <span className="font-semibold text-slate-600 dark:text-slate-300">
                            {(currentPage - 1) * ITEMS_PER_PAGE + 1}
                          </span>{' '}
                          to{' '}
                          <span className="font-semibold text-slate-600 dark:text-slate-300">
                            {Math.min(currentPage * ITEMS_PER_PAGE, group.users.length)}
                          </span>{' '}
                          of{' '}
                          <span className="font-semibold text-slate-600 dark:text-slate-300">
                            {group.users.length}
                          </span>{' '}
                          members
                        </span>
                        <div className="flex items-center gap-1.5">
                          <button
                            disabled={currentPage === 1}
                            onClick={() =>
                              setPages((prev) => ({ ...prev, [group.orgId]: currentPage - 1 }))
                            }
                            className="p-1.5 rounded-lg border border-slate-205 dark:border-slate-800 bg-white dark:bg-slate-950 hover:bg-slate-50 dark:hover:bg-slate-850 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer text-slate-600 dark:text-slate-350"
                          >
                            <ChevronLeft className="w-3.5 h-3.5" />
                          </button>
                          <span className="text-xs text-slate-550 font-semibold px-2">
                            Page {currentPage} of {totalPages}
                          </span>
                          <button
                            disabled={currentPage === totalPages}
                            onClick={() =>
                              setPages((prev) => ({ ...prev, [group.orgId]: currentPage + 1 }))
                            }
                            className="p-1.5 rounded-lg border border-slate-205 dark:border-slate-800 bg-white dark:bg-slate-955 hover:bg-slate-50 dark:hover:bg-slate-850 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer text-slate-600 dark:text-slate-350"
                          >
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
