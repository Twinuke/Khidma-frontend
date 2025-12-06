import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { HubConnection, HubConnectionBuilder } from '@microsoft/signalr';
import api from '../config/api';

interface ChatContextType {
  connection: HubConnection | null;
  connectToChat: () => Promise<void>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider = ({ children }: { children: ReactNode }) => {
  const [connection, setConnection] = useState<HubConnection | null>(null);

  const connectToChat = async () => {
    try {
      // Point to your backend Hub URL
      // Ensure 'API_BASE_URL' in api.ts is the base (e.g. http://192.168.1.103:5257)
      // The Hub is at /chatHub
      const hubUrl = "http://192.168.1.103:5257/chatHub"; // Replace with dynamic IP if needed

      const newConnection = new HubConnectionBuilder()
        .withUrl(hubUrl)
        .withAutomaticReconnect()
        .build();

      await newConnection.start();
      console.log("SignalR Connected!");
      setConnection(newConnection);
    } catch (e) {
      console.log("SignalR Connection Error", e);
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