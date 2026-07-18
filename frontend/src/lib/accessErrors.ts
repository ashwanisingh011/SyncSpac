export const ACCESS_RESTRICTED_TITLE = 'Access Restricted';
export const ACCESS_RESTRICTED_MESSAGE =
  "You don't have permission to modify this project. Please contact your Project Admin or Workspace Administrator if you need access.";

export function isAccessRestrictedError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;

  const response = (error as { response?: { status?: number; data?: { message?: string } } }).response;
  const message = response?.data?.message ?? (error as { message?: string }).message ?? '';

  return response?.status === 403 && isAccessRestrictedMessage(message);
}

export function isAccessRestrictedMessage(message: string): boolean {
  return /forbidden|insufficient permissions|access denied/i.test(message);
}
