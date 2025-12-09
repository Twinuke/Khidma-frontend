import { HubConnection, HubConnectionBuilder } from "@microsoft/signalr";
import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import api, { HUB_URL } from "../config/api";
import { useUser } from "./UserContext";

interface ChatContextType {
  connection: HubConnection | null;
  connectToChat: () => Promise<void>;
  totalUnreadCount: number; // ✅ The global count for the tab badge
  refreshUnreadCount: () => Promise<void>;
  setActiveConversationId: (id: number | null) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useUser();
  const [connection, setConnection] = useState<HubConnection | null>(null);
  const [totalUnreadCount, setTotalUnreadCount] = useState(0);

  // ✅ Tracks current open chat to prevent badge incrementing while reading
  const [activeConversationId, setActiveConversationId] = useState<
    number | null
  >(null);

  useEffect(() => {
    if (user?.userId) {
      refreshUnreadCount();
    }
  }, [user?.userId]);

  const refreshUnreadCount = async () => {
    if (!user?.userId) return;
    try {
      // Calls the new endpoint we made in ChatController
      const res = await api.get(`/Chat/unread/count/${user.userId}`);
      setTotalUnreadCount(res.data);
    } catch (error) {
      console.log("Failed to fetch unread count", error);
    }
  };

  const connectToChat = async () => {
    if (connection || !user?.userId) return;

    try {
      const newConnection = new HubConnectionBuilder()
        .withUrl(HUB_URL)
        .withAutomaticReconnect()
        .build();

      newConnection.on("ReceiveMessage", (msg: any) => {
        // ✅ Real-time logic:
        // If the message is NOT from me AND I am NOT currently reading that specific chat...
        if (msg.senderId !== user.userId) {
          if (msg.conversationId !== activeConversationId) {
            // ...Increment the global badge!
            setTotalUnreadCount((prev) => prev + 1);
          }
        }
      });

      await newConnection.start();
      console.log("✅ SignalR Connected!");
      setConnection(newConnection);
    } catch (e) {
      console.log("❌ SignalR Connection Error:", e);
    }
  };

  return (
    <ChatContext.Provider
      value={{
        connection,
        connectToChat,
        totalUnreadCount,
        refreshUnreadCount,
        setActiveConversationId,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) throw new Error("useChat must be used within ChatProvider");
  return context;
};
