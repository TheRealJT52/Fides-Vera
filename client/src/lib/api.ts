import { apiRequest } from "./queryClient";
import type { 
  Chat, 
  ChatWithMessages, 
  Message, 
  Document, 
  CreateMessageRequest,
  CreateChatRequest,
  CreateChatResponse
} from "./types";

// Document APIs
export async function getDocuments(): Promise<Document[]> {
  const res = await apiRequest("GET", "/api/documents");
  return res.json();
}

export async function getDocumentsByCategory(category: string): Promise<Document[]> {
  const res = await apiRequest("GET", `/api/documents/category/${category}`);
  return res.json();
}

// Chat APIs
export async function getChats(): Promise<Chat[]> {
  const res = await apiRequest("GET", "/api/chats");
  return res.json();
}

export async function getChat(id: number): Promise<ChatWithMessages> {
  const res = await apiRequest("GET", `/api/chats/${id}`);
  return res.json();
}

export async function createChat(data: CreateChatRequest): Promise<CreateChatResponse> {
  const res = await apiRequest("POST", "/api/chat", data);
  return res.json();
}

export async function updateChatTitle(id: number, title: string): Promise<Chat> {
  const res = await apiRequest("PATCH", `/api/chats/${id}`, { title });
  return res.json();
}

export async function deleteChat(id: number): Promise<void> {
  await apiRequest("DELETE", `/api/chats/${id}`);
}

// Message APIs
export async function getChatMessages(chatId: number): Promise<Message[]> {
  const res = await apiRequest("GET", `/api/chats/${chatId}/messages`);
  return res.json();
}

export async function sendMessage(
  chatId: number, 
  data: CreateMessageRequest
): Promise<Message> {
  const res = await apiRequest("POST", `/api/chats/${chatId}/messages`, data);
  return res.json();
}
