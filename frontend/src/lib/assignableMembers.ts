import type { WorkspaceMember } from '@/types/workspace';

export const isClientMember = (member: Pick<WorkspaceMember, 'role' | 'roleName'>): boolean => {
  const roleText = `${member.role ?? ''} ${member.roleName ?? ''}`.toLowerCase();
  return roleText.includes('client');
};

export const getAssignableMembers = <T extends Pick<WorkspaceMember, 'role' | 'roleName'>>(members: T[]): T[] => (
  members.filter((member) => !isClientMember(member))
);

export const formatMemberRole = (role?: string, roleName?: string): string => {
  const label = roleName || role;
  if (!label) return 'Member';

  return label
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((word) => {
      const upper = word.toUpperCase();
      if (upper === 'QA' || upper === 'HR') return upper;
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ');
};
