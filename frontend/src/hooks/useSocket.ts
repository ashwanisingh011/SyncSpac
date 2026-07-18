import { useEffect, useCallback } from 'react';
import { useSocketStore } from '@/store/socketStore';
import { useAuth } from '@/context/useAuth';
import { useOrganization } from '@/context/useOrganization';

/**
 * Custom hook to interact with the Socket.io connection.
 * Handles automatic connection based on active user login state,
 * joining the active organization room, and cleanups.
 */
export const useSocket = () => {
  const { user, isAuthReady } = useAuth();
  const { currentOrg } = useOrganization();
  const { socket, isConnected, connectSocket, disconnectSocket, emitEvent } = useSocketStore();

  // 1. Manage connection based on auth token availability
  useEffect(() => {
    if (!isAuthReady) return;

    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (user && token) {
      connectSocket(token);
    } else {
      disconnectSocket();
    }
  }, [user, isAuthReady, connectSocket, disconnectSocket]);

  // 2. Automatically join current organization room upon socket connection
  useEffect(() => {
    if (socket && isConnected && currentOrg?.id) {
      socket.emit('join-org', currentOrg.id);
    }
  }, [socket, isConnected, currentOrg?.id]);

  // Helper to join a specific project room
  const joinProject = useCallback((projectId: string) => {
    emitEvent('join-project', projectId);
  }, [emitEvent]);

  // Helper to leave/unview a task
  const unviewTask = useCallback((taskId: string, projectId: string) => {
    emitEvent('task:unview', { taskId, projectId });
  }, [emitEvent]);

  // Helper to view a task
  const viewTask = useCallback((taskId: string, projectId: string) => {
    emitEvent('task:view', { taskId, projectId });
  }, [emitEvent]);

  // Helper to emit typing state
  const setTypingState = useCallback((taskId: string, projectId: string, isTyping: boolean) => {
    emitEvent('task:typing', { taskId, projectId, isTyping });
  }, [emitEvent]);

  // Helper to emit task movement
  const moveTask = useCallback((taskId: string, projectId: string, status: string, order: number) => {
    emitEvent('task:move', { taskId, projectId, status, order });
  }, [emitEvent]);

  // Register an event listener that cleans up on unmount
  const useEventListener = useCallback((event: string, callback: (...args: any[]) => void) => {
    useEffect(() => {
      if (!socket) return;

      socket.on(event, callback);
      return () => {
        socket.off(event, callback);
      };
    }, [socket, event, callback]);
  }, [socket]);

  return {
    socket,
    isConnected,
    joinProject,
    viewTask,
    unviewTask,
    setTypingState,
    moveTask,
    useEventListener,
    emitEvent,
  };
};
