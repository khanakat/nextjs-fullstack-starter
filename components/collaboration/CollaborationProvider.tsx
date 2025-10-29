import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
  useCallback,
} from "react";
import { io, Socket } from "socket.io-client";
import { useAuth } from "@/hooks/useAuth";
import { logger } from "@/lib/logger";
import { useToast } from "@/hooks/use-toast";
import { Operation, SyncResult } from "@/lib/collaboration/sync-service";
import {
  CollaborationEvent,
  UserPresence,
  CursorPosition,
  TypingIndicator,
} from "@/lib/collaboration/event-service";

interface CollaborationContextType {
  // Connection state
  socket: Socket | null;
  isConnected: boolean;
  connectionStatus: "connecting" | "connected" | "disconnected" | "error";

  // Session management
  currentSession: string | null;
  joinSession: (sessionId: string, documentId?: string) => Promise<void>;
  leaveSession: () => Promise<void>;

  // Document collaboration
  syncDocument: (
    documentId: string,
    operations: Operation[],
    version: number,
  ) => Promise<SyncResult>;
  lockDocument: (documentId: string) => Promise<boolean>;
  unlockDocument: (documentId: string) => Promise<boolean>;

  // Real-time events
  sendDocumentChange: (
    documentId: string,
    operations: Operation[],
    version: number,
  ) => void;
  updateCursor: (
    documentId: string,
    position: number,
    selection?: { start: number; end: number },
  ) => void;
  setTyping: (documentId: string, isTyping: boolean, position?: number) => void;

  // Presence and awareness
  activeUsers: UserPresence[];
  cursors: CursorPosition[];
  typingUsers: TypingIndicator[];
  updatePresence: (
    status: UserPresence["status"],
    location: string,
    documentId?: string,
  ) => void;

  // Comments and collaboration
  addComment: (
    documentId: string,
    content: string,
    position: number,
    threadId?: string,
  ) => void;

  // Event listeners
  onDocumentChange: (
    callback: (event: CollaborationEvent) => void,
  ) => () => void;
  onCursorMove: (callback: (cursor: CursorPosition) => void) => () => void;
  onTypingChange: (callback: (typing: TypingIndicator) => void) => () => void;
  onPresenceUpdate: (callback: (presence: UserPresence) => void) => () => void;
  onUserJoin: (callback: (event: CollaborationEvent) => void) => () => void;
  onUserLeave: (callback: (event: CollaborationEvent) => void) => () => void;
}

const CollaborationContext = createContext<CollaborationContextType | null>(
  null,
);

interface CollaborationProviderProps {
  children: React.ReactNode;
  autoConnect?: boolean;
}

export function CollaborationProvider({
  children,
  autoConnect = true,
}: CollaborationProviderProps) {
  const { user } = useAuth();
  const { toast } = useToast();

  // Connection state
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<
    "connecting" | "connected" | "disconnected" | "error"
  >("disconnected");

  // Session state
  const [currentSession, setCurrentSession] = useState<string | null>(null);

  // Collaboration state
  const [activeUsers, setActiveUsers] = useState<UserPresence[]>([]);
  const [cursors, setCursors] = useState<CursorPosition[]>([]);
  const [typingUsers, setTypingUsers] = useState<TypingIndicator[]>([]);

  // Event listeners
  const eventListeners = useRef<Map<string, Set<Function>>>(new Map());

  // Emit events to registered listeners
  const emitToListeners = useCallback((eventType: string, data: any) => {
    const listeners = eventListeners.current.get(eventType);
    if (listeners) {
      listeners.forEach((callback) => callback(data));
    }
  }, []);

  // Handle collaboration events
  const handleCollaborationEvent = useCallback(
    (event: CollaborationEvent) => {
      logger.debug("Collaboration event received", "COLLABORATION", event);

      switch (event.type) {
        case "document_change":
          emitToListeners("document_change", event);
          break;

        case "cursor_move":
          const cursorData = event.data as CursorPosition;
          setCursors((prev) => {
            const filtered = prev.filter((c) => c.userId !== cursorData.userId);
            return [...filtered, cursorData];
          });
          emitToListeners("cursor_move", cursorData);
          break;

        case "typing_start":
        case "typing_stop":
          const typingData = event.data as TypingIndicator;
          setTypingUsers((prev) => {
            const filtered = prev.filter((t) => t.userId !== typingData.userId);
            return typingData.isTyping ? [...filtered, typingData] : filtered;
          });
          emitToListeners("typing_change", typingData);
          break;

        case "presence_update":
          const presenceData = event.data as UserPresence;
          setActiveUsers((prev) => {
            const filtered = prev.filter(
              (u) => u.userId !== presenceData.userId,
            );
            return [...filtered, presenceData];
          });
          emitToListeners("presence_update", presenceData);
          break;

        case "user_join":
          emitToListeners("user_join", event);
          // Add user to active users if not already present
          const joinUserId = event.data.userId;
          setActiveUsers((prev) => {
            if (prev.some((u) => u.userId === joinUserId)) return prev;
            return [...prev, event.data];
          });
          break;

        case "user_leave":
          emitToListeners("user_leave", event);
          // Clean up user data
          const leavingUserId = event.data.userId;
          setCursors((prev) => prev.filter((c) => c.userId !== leavingUserId));
          setTypingUsers((prev) =>
            prev.filter((t) => t.userId !== leavingUserId),
          );
          setActiveUsers((prev) =>
            prev.filter((u) => u.userId !== leavingUserId),
          );
          break;
      }
    },
    [emitToListeners],
  );

  // Handle session state updates
  const handleSessionState = useCallback((state: any) => {
    logger.debug("Session state update", "COLLABORATION", state);
    setActiveUsers(state.participants || []);
    setCursors(state.cursors || []);
    setTypingUsers(state.typingIndicators || []);
  }, []);

  // Handle sync responses
  const handleSyncResponse = useCallback((response: SyncResult) => {
    logger.debug("Sync response received", "COLLABORATION", response);
    // Handle sync response logic here
  }, []);

  // Initialize socket connection
  useEffect(() => {
    if (!user || !autoConnect) return;

    const initSocket = async (): Promise<Socket | undefined> => {
      setConnectionStatus("connecting");

      try {
        // Initialize socket.io server
        await fetch("/api/socket/io");

        const newSocket = io({
          path: "/api/socket/io",
          addTrailingSlash: false,
          auth: {
            userId: user.id,
            // organizationId: user.organizationId || '',
          },
        });

        newSocket.on("connect", () => {
          logger.debug("Socket connected", "COLLABORATION");
          setIsConnected(true);
          setConnectionStatus("connected");
          setSocket(newSocket);
        });

        newSocket.on("disconnect", () => {
          logger.debug("Socket disconnected", "COLLABORATION");
          setIsConnected(false);
          setConnectionStatus("disconnected");
        });

        newSocket.on("error", (error: any) => {
          logger.error("Socket error", "COLLABORATION", error);
          setConnectionStatus("error");
          toast({
            title: "Connection Error",
            message: "Collaboration connection error",
            type: "error",
          });
        });

        // Set up event handlers
        newSocket.on("collaboration_event", handleCollaborationEvent);
        newSocket.on("session_state", handleSessionState);
        newSocket.on("sync_response", handleSyncResponse);

        return newSocket;
      } catch (error) {
        console.error("Failed to initialize socket:", error);
        setConnectionStatus("error");
        toast({
          title: "Connection Failed",
          message: "Unable to establish collaboration connection",
          type: "error",
        });
        return undefined;
      }
    };

    initSocket();

    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [
    user,
    autoConnect,
    toast,
    handleCollaborationEvent,
    handleSessionState,
    handleSyncResponse,
    socket,
  ]);

  // Presence management
  const updatePresence = useCallback(
    (status: UserPresence["status"], location: string, documentId?: string) => {
      if (!socket || !user) return;

      socket.emit("presence_update", {
        userId: user.id,
        status,
        location,
        documentId,
        timestamp: new Date().toISOString(),
      });
    },
    [socket, user],
  );

  // Session management
  const joinSession = useCallback(
    async (sessionId: string, documentId?: string) => {
      if (!socket || !user) return;

      try {
        socket.emit("join_session", {
          sessionId,
          userId: user.id,
          documentId,
          metadata: {
            userAgent: navigator.userAgent,
            timestamp: new Date(),
          },
        });

        setCurrentSession(sessionId);

        // Update presence
        updatePresence("online", window.location.pathname, documentId);

        toast({
          title: "Joined Collaboration",
          message: "You are now collaborating in real-time",
          type: "success",
        });
      } catch (error) {
        console.error("Error joining session:", error);
        toast({
          title: "Join Failed",
          message: "Failed to join collaboration session",
          type: "error",
        });
      }
    },
    [socket, user, toast, updatePresence],
  );

  const leaveSession = useCallback(async () => {
    if (!socket || !currentSession) return;

    try {
      socket.emit("leave_session", {
        sessionId: currentSession,
        userId: user?.id,
      });

      setCurrentSession(null);
      setActiveUsers([]);
      setCursors([]);
      setTypingUsers([]);

      toast({
        title: "Left Collaboration",
        message: "You have left the collaboration session",
        type: "info",
      });
    } catch (error) {
      console.error("Error leaving session:", error);
    }
  }, [socket, currentSession, user, toast]);

  // Document collaboration
  const syncDocument = useCallback(
    async (
      documentId: string,
      operations: Operation[],
      version: number,
    ): Promise<SyncResult> => {
      if (!socket || !user) {
        return { success: false, newVersion: version, error: "Not connected" };
      }

      return new Promise((resolve) => {
        const requestId = `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        // Listen for response
        const handleResponse = (
          response: SyncResult & { requestId: string },
        ) => {
          if (response.requestId === requestId) {
            socket.off("sync_response", handleResponse);
            resolve(response);
          }
        };

        socket.on("sync_response", handleResponse);

        // Send sync request
        socket.emit("sync_document", {
          requestId,
          documentId,
          operations,
          version,
          userId: user.id,
          organizationId: (user as any).organizationId,
        });

        // Timeout after 10 seconds
        setTimeout(() => {
          socket.off("sync_response", handleResponse);
          resolve({
            success: false,
            newVersion: version,
            error: "Sync timeout",
          });
        }, 10000);
      });
    },
    [socket, user],
  );

  const lockDocument = useCallback(
    async (documentId: string): Promise<boolean> => {
      if (!socket || !user) return false;

      return new Promise((resolve) => {
        const requestId = `lock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        const handleResponse = (response: {
          requestId: string;
          success: boolean;
        }) => {
          if (response.requestId === requestId) {
            socket.off("lock_response", handleResponse);
            resolve(response.success);
          }
        };

        socket.on("lock_response", handleResponse);
        socket.emit("lock_document", {
          requestId,
          documentId,
          userId: user.id,
        });

        setTimeout(() => {
          socket.off("lock_response", handleResponse);
          resolve(false);
        }, 5000);
      });
    },
    [socket, user],
  );

  const unlockDocument = useCallback(
    async (documentId: string): Promise<boolean> => {
      if (!socket || !user) return false;

      return new Promise((resolve) => {
        const requestId = `unlock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        const handleResponse = (response: {
          requestId: string;
          success: boolean;
        }) => {
          if (response.requestId === requestId) {
            socket.off("unlock_response", handleResponse);
            resolve(response.success);
          }
        };

        socket.on("unlock_response", handleResponse);
        socket.emit("unlock_document", {
          requestId,
          documentId,
          userId: user.id,
        });

        setTimeout(() => {
          socket.off("unlock_response", handleResponse);
          resolve(false);
        }, 5000);
      });
    },
    [socket, user],
  );

  // Real-time events
  const sendDocumentChange = useCallback(
    (documentId: string, operations: Operation[], version: number) => {
      if (!socket || !currentSession || !user) return;

      socket.emit("document_change", {
        sessionId: currentSession,
        documentId,
        operations,
        version,
        userId: user.id,
      });
    },
    [socket, currentSession, user],
  );

  const updateCursor = useCallback(
    (
      documentId: string,
      position: number,
      selection?: { start: number; end: number },
    ) => {
      if (!socket || !currentSession || !user) return;

      socket.emit("cursor_update", {
        sessionId: currentSession,
        documentId,
        userId: user.id,
        position,
        selection,
      });
    },
    [socket, currentSession, user],
  );

  const setTyping = useCallback(
    (documentId: string, isTyping: boolean, position?: number) => {
      if (!socket || !currentSession || !user) return;

      socket.emit("typing_indicator", {
        sessionId: currentSession,
        documentId,
        userId: user.id,
        isTyping,
        position,
      });
    },
    [socket, currentSession, user],
  );

  const addComment = useCallback(
    (
      documentId: string,
      content: string,
      position: number,
      threadId?: string,
    ) => {
      if (!socket || !currentSession || !user) return;

      socket.emit("add_comment", {
        sessionId: currentSession,
        documentId,
        userId: user.id,
        content,
        position,
        threadId,
      });
    },
    [socket, currentSession, user],
  );

  // Event listener management
  const createEventListener = useCallback((eventType: string) => {
    return (callback: Function) => {
      if (!eventListeners.current.has(eventType)) {
        eventListeners.current.set(eventType, new Set());
      }

      eventListeners.current.get(eventType)!.add(callback);

      // Return cleanup function
      return () => {
        const listeners = eventListeners.current.get(eventType);
        if (listeners) {
          listeners.delete(callback);
          if (listeners.size === 0) {
            eventListeners.current.delete(eventType);
          }
        }
      };
    };
  }, []);

  const onDocumentChange = useCallback(
    (callback: (event: CollaborationEvent) => void) =>
      createEventListener("document_change")(callback),
    [createEventListener],
  );
  const onCursorMove = useCallback(
    (callback: (cursor: CursorPosition) => void) =>
      createEventListener("cursor_move")(callback),
    [createEventListener],
  );
  const onTypingChange = useCallback(
    (callback: (typing: TypingIndicator) => void) =>
      createEventListener("typing_change")(callback),
    [createEventListener],
  );
  const onPresenceUpdate = useCallback(
    (callback: (presence: UserPresence) => void) =>
      createEventListener("presence_update")(callback),
    [createEventListener],
  );
  const onUserJoin = useCallback(
    (callback: (event: CollaborationEvent) => void) =>
      createEventListener("user_join")(callback),
    [createEventListener],
  );
  const onUserLeave = useCallback(
    (callback: (event: CollaborationEvent) => void) =>
      createEventListener("user_leave")(callback),
    [createEventListener],
  );

  const value: CollaborationContextType = {
    // Connection state
    socket,
    isConnected,
    connectionStatus,

    // Session management
    currentSession,
    joinSession,
    leaveSession,

    // Document collaboration
    syncDocument,
    lockDocument,
    unlockDocument,

    // Real-time events
    sendDocumentChange,
    updateCursor,
    setTyping,

    // Presence and awareness
    activeUsers,
    cursors,
    typingUsers,
    updatePresence,

    // Comments
    addComment,

    // Event listeners
    onDocumentChange,
    onCursorMove,
    onTypingChange,
    onPresenceUpdate,
    onUserJoin,
    onUserLeave,
  };

  return (
    <CollaborationContext.Provider value={value}>
      {children}
    </CollaborationContext.Provider>
  );
}

export function useCollaboration() {
  const context = useContext(CollaborationContext);
  if (!context) {
    throw new Error(
      "useCollaboration must be used within a CollaborationProvider",
    );
  }
  return context;
}
