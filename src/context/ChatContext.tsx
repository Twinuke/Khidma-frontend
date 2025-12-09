import { HubConnection, HubConnectionBuilder } from "@microsoft/signalr";
import React, { createContext, ReactNode, useContext, useState } from "react";
import { HUB_URL } from "../config/api";
import { useUser } from "./UserContext";

interface ChatContextType {
  connection: HubConnection | null;
  connectToChat: () => Promise<void>;
  setActiveConversationId: (id: number | null) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider = ({ children }: { children: ReactNode }) => {
  const { user, refreshCounts } = useUser(); // ✅ Import refreshCounts
  const [connection, setConnection] = useState<HubConnection | null>(null);
  const [activeConversationId, setActiveConversationId] = useState<
    number | null
  >(null);

  const connectToChat = async () => {
    if (connection || !user?.userId) return;

    try {
      const newConnection = new HubConnectionBuilder()
        .withUrl(HUB_URL)
        .withAutomaticReconnect()
        .build();

      newConnection.on("ReceiveMessage", (msg: any) => {
        // ✅ If message is not from me and I'm not in that chat...
        if (msg.senderId !== user.userId) {
          if (msg.conversationId !== activeConversationId) {
            // ...Trigger Global Refresh in UserContext (Updates badge)
            refreshCounts();
          }
        }
      });

      await newConnection.start();
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
