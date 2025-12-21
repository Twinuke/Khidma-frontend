import { HubConnection, HubConnectionBuilder } from "@microsoft/signalr";
import React, { createContext, ReactNode, useContext, useState, useEffect } from "react";
import { HUB_URL } from "../config/api";
import { useUser } from "./UserContext";

interface ChatContextType {
  connection: HubConnection | null;
  connectToChat: () => Promise<void>;
  setActiveConversationId: (id: number | null) => void;
  onlineUsers: number[]; // ✅ Expose online users list
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider = ({ children }: { children: ReactNode }) => {
  const { user, refreshCounts } = useUser();
  const [connection, setConnection] = useState<HubConnection | null>(null);
  const [activeConversationId, setActiveConversationId] = useState<number | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<number[]>([]); // ✅ State for online users

  const connectToChat = async () => {
    // Prevent double connection
    if (connection || !user?.userId) return;

    try {
      // ✅ Pass userId in query string so Backend knows who connected
      const newConnection = new HubConnectionBuilder()
        .withUrl(`${HUB_URL}?userId=${user.userId}`)
        .withAutomaticReconnect()
        .build();

      // --- Listeners ---
      
      newConnection.on("ReceiveMessage", (msg: any) => {
        if (msg.senderId !== user.userId && msg.conversationId !== activeConversationId) {
          refreshCounts();
        }
      });

      // ✅ Update Online Status Real-time
      newConnection.on("UserIsOnline", (userId: number) => {
        setOnlineUsers((prev) => [...new Set([...prev, userId])]);
      });

      newConnection.on("UserIsOffline", (userId: number) => {
        setOnlineUsers((prev) => prev.filter((id) => id !== userId));
      });

      await newConnection.start();

      // ✅ Fetch initial list of online users
      const currentOnline = await newConnection.invoke("GetOnlineUsers");
      setOnlineUsers(currentOnline);

      setConnection(newConnection);
    } catch (e) {
      console.log("SignalR Error:", e);
    }
  };

  return (
    <ChatContext.Provider
      value={{
        connection,
        connectToChat,
        setActiveConversationId,
        onlineUsers, // ✅
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