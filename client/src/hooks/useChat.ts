import { useCallback, useState, useEffect } from "react";
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
    onSuccess: (responseMessage, variables) => {
      // Immediately update the chat with both user message and response
      queryClient.setQueryData(["/api/chats", variables.chatId], (oldData: any) => {
        if (!oldData) return oldData;
        
        const now = new Date();
        const newMessages = [
          ...(oldData.messages || []),
          {
            id: oldData.messages?.length + 1 || 1,
            chatId: variables.chatId,
            role: "user",
            content: variables.message,
            createdAt: now
          },
          {
            id: oldData.messages?.length + 2 || 2,
            chatId: variables.chatId,
            role: "assistant",
            content: responseMessage.content,
            sources: responseMessage.sources,
            createdAt: now
          }
        ];
        
        return {
          ...oldData,
          messages: newMessages
        };
      });
      
      // Also refresh the data
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
    onSuccess: (data, variables) => {
      setCurrentChatId(data.chatId);
      
      // Manually update cache to immediately show the assistant's message
      queryClient.setQueryData(["/api/chats", data.chatId], (oldData: any) => {
        // If there's no existing data, create a new chat object
        if (!oldData) {
          const now = new Date();
          return {
            id: data.chatId,
            title: "New Chat",
            createdAt: now,
            messages: [
              {
                id: 0,
                chatId: data.chatId,
                role: "user",
                content: variables.message,
                createdAt: now
              },
              {
                id: 1,
                chatId: data.chatId,
                role: "assistant",
                content: data.message.content,
                sources: data.message.sources,
                createdAt: now
              }
            ]
          };
        }
        
        // Otherwise add to existing chat
        return oldData;
      });
      
      // Then invalidate queries to fetch fresh data
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

  // Keep local messages state for immediate display
  const [localMessages, setLocalMessages] = useState<Message[]>([]);
  
  // Update local messages when server data changes
  useEffect(() => {
    if (chatQuery.data && (chatQuery.data as any).messages) {
      setLocalMessages((chatQuery.data as any).messages);
    }
  }, [chatQuery.data]);
  
  // Override handleSendMessage to update local messages immediately
  const handleSendMessageWithLocalUpdate = useCallback(
    (message: string) => {
      // User message
      const userMessage: Message = {
        id: Date.now(),
        chatId: currentChatId || 0,
        role: "user",
        content: message,
        createdAt: new Date()
      };
      
      // Add user message immediately
      setLocalMessages(prev => [...prev, userMessage]);
      
      // Show loading state
      setIsProcessing(true);
      
      // Send to server
      if (!currentChatId) {
        createChatMutation.mutate({ message }, {
          onSuccess: (data) => {
            // Add AI response when it comes back
            const aiMessage: Message = {
              id: Date.now() + 1,
              chatId: data.chatId,
              role: "assistant",
              content: data.message.content,
              sources: data.message.sources,
              createdAt: new Date()
            };
            setLocalMessages(prev => [...prev, aiMessage]);
            setIsProcessing(false);
          },
          onError: () => {
            setIsProcessing(false);
          }
        });
      } else {
        sendMessageMutation.mutate({ chatId: currentChatId, message }, {
          onSuccess: (response) => {
            // Add AI response when it comes back
            const aiMessage: Message = {
              id: Date.now() + 1,
              chatId: currentChatId,
              role: "assistant", 
              content: response.content,
              sources: response.sources,
              createdAt: new Date()
            };
            setLocalMessages(prev => [...prev, aiMessage]);
            setIsProcessing(false);
          },
          onError: () => {
            setIsProcessing(false);
          }
        });
      }
    },
    [currentChatId, sendMessageMutation, createChatMutation]
  );
  
  return {
    chats: chatsQuery.data as Chat[] | undefined,
    currentChat: { 
      ...(chatQuery.data as any), 
      messages: localMessages 
    },
    isLoadingChats: chatsQuery.isLoading,
    isLoadingCurrentChat: chatQuery.isLoading,
    isProcessing,
    sendMessage: handleSendMessageWithLocalUpdate,
    newChat: handleNewChat,
    selectChat: handleSelectChat,
    currentChatId,
  };
}
