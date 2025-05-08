import { useCallback, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { 
  getChat, 
  getChatMessages, 
  sendMessage, 
  createChat, 
  getChats 
} from "@/lib/api";
import type { Message, Chat, CreateChatRequest } from "@/lib/types";

export function useChat(chatId?: number) {
  const { toast } = useToast();
  const [currentChatId, setCurrentChatId] = useState<number | undefined>(chatId);
  const [isProcessing, setIsProcessing] = useState(false);

  // Fetch chats
  const chatsQuery = useQuery({
    queryKey: ["/api/chats"],
    enabled: true,
  });

  // Fetch current chat and messages if a chatId is provided
  const chatQuery = useQuery({
    queryKey: ["/api/chats", currentChatId],
    enabled: !!currentChatId,
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async ({ 
      chatId, 
      message 
    }: { 
      chatId: number; 
      message: string 
    }) => {
      setIsProcessing(true);
      const response = await sendMessage(chatId, { content: message });
      setIsProcessing(false);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/chats", currentChatId] });
    },
    onError: (error) => {
      toast({
        title: "Error sending message",
        description: error instanceof Error ? error.message : String(error),
        variant: "destructive",
      });
      setIsProcessing(false);
    },
  });

  // Create new chat mutation
  const createChatMutation = useMutation({
    mutationFn: async ({ message, title }: CreateChatRequest) => {
      setIsProcessing(true);
      const response = await createChat({ message, title });
      setIsProcessing(false);
      return response;
    },
    onSuccess: (data) => {
      setCurrentChatId(data.chatId);
      queryClient.invalidateQueries({ queryKey: ["/api/chats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/chats", data.chatId] });
    },
    onError: (error) => {
      toast({
        title: "Error creating chat",
        description: error instanceof Error ? error.message : String(error),
        variant: "destructive",
      });
      setIsProcessing(false);
    },
  });

  // Handler for sending a message in an existing chat
  const handleSendMessage = useCallback(
    (message: string) => {
      if (!currentChatId) {
        // Create a new chat with the message
        createChatMutation.mutate({ message });
      } else {
        // Send message to existing chat
        sendMessageMutation.mutate({ chatId: currentChatId, message });
      }
    },
    [currentChatId, sendMessageMutation, createChatMutation]
  );

  // Start a new chat
  const handleNewChat = useCallback(() => {
    setCurrentChatId(undefined);
  }, []);

  // Select a chat
  const handleSelectChat = useCallback((id: number) => {
    setCurrentChatId(id);
  }, []);

  return {
    chats: chatsQuery.data as Chat[] | undefined,
    currentChat: chatQuery.data as any,
    isLoadingChats: chatsQuery.isLoading,
    isLoadingCurrentChat: chatQuery.isLoading,
    isProcessing,
    sendMessage: handleSendMessage,
    newChat: handleNewChat,
    selectChat: handleSelectChat,
    currentChatId,
  };
}
