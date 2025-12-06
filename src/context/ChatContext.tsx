import React, { createContext, useContext, useState, ReactNode } from 'react';
import { HubConnection, HubConnectionBuilder } from '@microsoft/signalr';
import { HUB_URL } from '../config/api'; // ✅ Import from config

interface ChatContextType {
  connection: HubConnection | null;
  connectToChat: () => Promise<void>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider = ({ children }: { children: ReactNode }) => {
  const [connection, setConnection] = useState<HubConnection | null>(null);

  const connectToChat = async () => {
    try {
      // Prevent multiple connections
      if (connection) return;

      console.log("🔌 Connecting to Chat Hub at:", HUB_URL);

      const newConnection = new HubConnectionBuilder()
        .withUrl(HUB_URL) // ✅ Uses the dynamic URL from api.ts
        .withAutomaticReconnect()
        .build();

      await newConnection.start();
      console.log("✅ SignalR Connected!");
      setConnection(newConnection);
    } catch (e) {
      console.log("❌ SignalR Connection Error:", e);
    }
  };

  return (
    <ChatContext.Provider value={{ connection, connectToChat }}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) throw new Error("useChat must be used within ChatProvider");
  return context;
};