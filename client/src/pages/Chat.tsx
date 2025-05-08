import { useState, useEffect, useRef } from 'react';
import { useParams } from 'wouter';
import { useChat } from '@/hooks/useChat';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import ChatInput from '@/components/ChatInput';
import ChatMessage, { LoadingMessage } from '@/components/ChatMessage';
import SourcePanel from '@/components/SourcePanel';
import { SourcesSection } from '@/components/SourceCitation';
import { cn } from '@/lib/utils';
import { systemPrompt } from '@/data/catholicTexts';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useIsMobile } from '@/hooks/use-mobile';
import { Message } from '@/lib/types';

export default function Chat() {
  const params = useParams();
  const chatId = params.id ? parseInt(params.id) : undefined;
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const { 
    chats,
    currentChat,
    currentChatId,
    isLoadingChats,
    isLoadingCurrentChat,
    isProcessing,
    sendMessage,
    newChat,
    selectChat
  } = useChat(chatId);

  // Scroll to bottom when messages change - disable automatic scrolling
  // useEffect(() => {
  //   messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  // }, [currentChat?.messages]);

  // Toggle sidebar visibility
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Welcome message for new chats
  const getWelcomeMessage = () => ({
    id: 0,
    chatId: 0,
    role: 'assistant' as const,
    content: "Welcome to Fides, your Catholic teaching assistant. I'm here to help you explore Catholic teachings, doctrine, and tradition using authentic Catholic sources. How may I assist you today?",
    createdAt: new Date()
  });

  // Determine what messages to show
  const messagesToShow = currentChat?.messages || [];
  const showWelcomeMessage = !currentChatId && messagesToShow.length === 0;

  return (
    <div className="flex flex-col h-screen bg-[#F8F5E6]">
      <Header onNewChat={newChat} toggleSidebar={toggleSidebar} />
      
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          isOpen={sidebarOpen}
          chats={chats}
          currentChatId={currentChatId}
          onSelectChat={selectChat}
        />
        
        <main className="flex-1 flex flex-col bg-[#F8F5E6] overflow-hidden">
          <div className="flex-1 px-4 py-6 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 140px)' }}>
            <div className="max-w-4xl mx-auto space-y-4">
              {isLoadingCurrentChat ? (
                <div className="flex items-center justify-center h-32">
                  <div className="text-sm text-gray-500">Loading conversation...</div>
                </div>
              ) : (
                <>
                  {/* Welcome message for new chats */}
                  {showWelcomeMessage && (
                    <ChatMessage message={getWelcomeMessage()} />
                  )}
                  
                  {/* Conversation messages */}
                  {messagesToShow.map((message: Message) => (
                    <ChatMessage key={message.id} message={message} />
                  ))}
                  
                  {/* Loading indicator while processing */}
                  {isProcessing && <LoadingMessage />}
                  
                  {/* Sources section (for most recent assistant message) */}
                  {messagesToShow.length > 0 && 
                   messagesToShow[messagesToShow.length - 1].role === 'assistant' &&
                   messagesToShow[messagesToShow.length - 1].sources && (
                    <SourcesSection 
                      sources={messagesToShow[messagesToShow.length - 1].sources || []} 
                    />
                  )}
                </>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>
          
          <ChatInput 
            onSendMessage={sendMessage} 
            isDisabled={isProcessing}
          />
        </main>
        
        <SourcePanel 
          sources={currentChat?.messages?.find((m: Message) => m.role === 'assistant')?.sources}
          isVisible={false}
        />
      </div>
    </div>
  );
}
