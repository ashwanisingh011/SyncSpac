import {
  ACCESS_RESTRICTED_MESSAGE,
  isAccessRestrictedError,
  isAccessRestrictedMessage,
} from '@/lib/accessErrors';

type ApiErrorLike = {
  message?: string;
  response?: {
    status?: number;
    data?: {
      message?: string;
      error?: string;
      type?: string;
      limitType?: string;
      currentUsage?: number;
      allowedLimit?: number;
    };
  };
};

const SERVER_ERROR_MESSAGE =
  'Something went wrong on our side. Please try again in a moment.';
const NETWORK_ERROR_MESSAGE =
  "We couldn't reach the server. Check your connection and try again.";
const SESSION_EXPIRED_MESSAGE =
  'Your session has expired. Please sign in again to continue.';

const TECHNICAL_MESSAGE_PATTERN =
  /forbidden|insufficient permissions|access denied|internal server error|server error|code failed|request failed|status code|failed with 5\d\d|^5\d\d$/i;

function getRawApiMessage(error: unknown): string {
  if (!error || typeof error !== 'object') return '';

  const apiError = error as ApiErrorLike;
  return apiError.response?.data?.message ?? apiError.response?.data?.error ?? apiError.message ?? '';
}

export function getApiStatus(error: unknown): number | undefined {
  if (!error || typeof error !== 'object') return undefined;
  return (error as ApiErrorLike).response?.status;
}

export function getFriendlyApiErrorMessage(error: unknown, fallback: string): string {
  const status = getApiStatus(error);
  const rawMessage = getRawApiMessage(error).trim();
  const responseData = (error as ApiErrorLike).response?.data;

  // Intercept subscription limit exceeded errors first
  if (
    responseData?.type === 'LIMIT_EXCEEDED' ||
    responseData?.limitType ||
    rawMessage.toLowerCase().includes('limit exceeded') ||
    rawMessage.toLowerCase().includes('upgrade your subscription')
  ) {
    if (responseData?.message) {
      return responseData.message;
    }
    if (rawMessage) {
      return rawMessage;
    }
    // Fallback limit type messages
    const limitType = responseData?.limitType || '';
    if (limitType === 'users') {
      return 'Workspace member limit exceeded. Please upgrade your plan to invite more members.';
    }
    if (limitType === 'projects') {
      return 'Project limit exceeded. Please upgrade your plan to create more projects.';
    }
    if (limitType === 'storage') {
      return 'Storage limit exceeded. Please upgrade your plan to upload more files.';
    }
    if (limitType === 'customRoles') {
      return 'Custom roles are not supported on your current plan. Please upgrade your subscription.';
    }
    if (limitType === 'apiCalls') {
      return 'API call limit exceeded. Please upgrade your subscription.';
    }
    return 'Subscription limit exceeded. Please upgrade your plan.';
  }

  if (isAccessRestrictedError(error) || status === 403 || isAccessRestrictedMessage(rawMessage)) {
    return ACCESS_RESTRICTED_MESSAGE;
  }

  if (status === 401) {
    return SESSION_EXPIRED_MESSAGE;
  }

  if (status === 429) {
    return rawMessage || 'Too many requests. Please wait a moment and try again.';
  }

  if (!status && rawMessage.toLowerCase() === 'network error') {
    return NETWORK_ERROR_MESSAGE;
  }

  if ((status && status >= 500) || /(^|\D)5\d\d($|\D)/.test(rawMessage)) {
    return SERVER_ERROR_MESSAGE;
  }

  if (!rawMessage || TECHNICAL_MESSAGE_PATTERN.test(rawMessage)) {
    return fallback;
  }

  return rawMessage;
}
