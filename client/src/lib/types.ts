export interface User {
  id: number;
  username: string;
}

export interface Chat {
  id: number;
  title: string;
  userId?: number;
  createdAt: Date;
}

export interface ChatWithMessages extends Chat {
  messages: Message[];
}

export interface Message {
  id: number;
  chatId: number;
  role: "user" | "assistant" | "system";
  content: string;
  sources?: SourceReference[];
  createdAt: Date;
}

export interface SourceReference {
  id: number;
  title: string;
  content?: string;
  source: string;
  category?: string;
  section?: string;
  relevanceScore?: number;
}

export interface Document {
  id: number;
  title: string;
  content: string;
  source: string;
  category: string;
  metadata?: Record<string, any>;
}

export interface CreateMessageRequest {
  content: string;
}

export interface CreateChatRequest {
  message: string;
  title?: string;
}

export interface CreateChatResponse {
  chatId: number;
  message: {
    role: "assistant";
    content: string;
    sources: SourceReference[];
  };
}
