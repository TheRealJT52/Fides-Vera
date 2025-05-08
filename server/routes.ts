import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { z } from "zod";
import { storage } from "./storage";
import { ragService } from "./services/ragService";
import { 
  insertChatSchema, 
  insertMessageSchema,
  messageWithRole 
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // API Routes - all prefixed with /api
  
  // Get all documents (knowledge base)
  app.get("/api/documents", async (req: Request, res: Response) => {
    try {
      const documents = await storage.getDocuments();
      res.json(documents);
    } catch (error) {
      console.error("Error fetching documents:", error);
      res.status(500).json({ message: "Failed to fetch documents" });
    }
  });

  // Get documents by category
  app.get("/api/documents/category/:category", async (req: Request, res: Response) => {
    try {
      const { category } = req.params;
      const documents = await storage.getDocumentsByCategory(category);
      res.json(documents);
    } catch (error) {
      console.error(`Error fetching documents for category ${req.params.category}:`, error);
      res.status(500).json({ message: "Failed to fetch documents by category" });
    }
  });

  // Create a new chat
  app.post("/api/chats", async (req: Request, res: Response) => {
    try {
      const parseResult = insertChatSchema.safeParse(req.body);
      
      if (!parseResult.success) {
        return res.status(400).json({ 
          message: "Invalid chat data", 
          errors: parseResult.error.errors 
        });
      }
      
      const chat = await storage.createChat(parseResult.data);
      res.status(201).json(chat);
    } catch (error) {
      console.error("Error creating chat:", error);
      res.status(500).json({ message: "Failed to create chat" });
    }
  });

  // Get all chats (optionally filtered by userId)
  app.get("/api/chats", async (req: Request, res: Response) => {
    try {
      const userId = req.query.userId ? Number(req.query.userId) : undefined;
      
      if (userId) {
        const chats = await storage.getChatsByUserId(userId);
        return res.json(chats);
      } else {
        // For demo purposes, get all chats since we don't have auth
        const allChats = [];
        for (let i = 1; i <= 10; i++) {
          const chats = await storage.getChatsByUserId(i);
          allChats.push(...chats);
        }
        return res.json(allChats);
      }
    } catch (error) {
      console.error("Error fetching chats:", error);
      res.status(500).json({ message: "Failed to fetch chats" });
    }
  });

  // Get a specific chat with its messages
  app.get("/api/chats/:id", async (req: Request, res: Response) => {
    try {
      const chatId = Number(req.params.id);
      const chat = await storage.getChat(chatId);
      
      if (!chat) {
        return res.status(404).json({ message: "Chat not found" });
      }
      
      const messages = await storage.getMessagesByChatId(chatId);
      
      res.json({
        ...chat,
        messages
      });
    } catch (error) {
      console.error(`Error fetching chat ${req.params.id}:`, error);
      res.status(500).json({ message: "Failed to fetch chat" });
    }
  });

  // Update chat title
  app.patch("/api/chats/:id", async (req: Request, res: Response) => {
    try {
      const chatId = Number(req.params.id);
      const { title } = req.body;
      
      if (!title || typeof title !== "string") {
        return res.status(400).json({ message: "Valid title is required" });
      }
      
      const updatedChat = await storage.updateChatTitle(chatId, title);
      
      if (!updatedChat) {
        return res.status(404).json({ message: "Chat not found" });
      }
      
      res.json(updatedChat);
    } catch (error) {
      console.error(`Error updating chat ${req.params.id}:`, error);
      res.status(500).json({ message: "Failed to update chat" });
    }
  });

  // Delete a chat
  app.delete("/api/chats/:id", async (req: Request, res: Response) => {
    try {
      const chatId = Number(req.params.id);
      const success = await storage.deleteChat(chatId);
      
      if (!success) {
        return res.status(404).json({ message: "Chat not found" });
      }
      
      res.status(204).end();
    } catch (error) {
      console.error(`Error deleting chat ${req.params.id}:`, error);
      res.status(500).json({ message: "Failed to delete chat" });
    }
  });

  // Get messages for a chat
  app.get("/api/chats/:id/messages", async (req: Request, res: Response) => {
    try {
      const chatId = Number(req.params.id);
      const messages = await storage.getMessagesByChatId(chatId);
      res.json(messages);
    } catch (error) {
      console.error(`Error fetching messages for chat ${req.params.id}:`, error);
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  // Send a message and get a response (main RAG endpoint)
  app.post("/api/chats/:id/messages", async (req: Request, res: Response) => {
    try {
      const chatId = Number(req.params.id);
      const chat = await storage.getChat(chatId);
      
      if (!chat) {
        return res.status(404).json({ message: "Chat not found" });
      }
      
      // Validate the message
      const messageSchema = z.object({
        content: z.string().min(1, "Message content is required"),
      });
      
      const parseResult = messageSchema.safeParse(req.body);
      
      if (!parseResult.success) {
        return res.status(400).json({ 
          message: "Invalid message data", 
          errors: parseResult.error.errors 
        });
      }
      
      // Get conversation history
      const previousMessages = await storage.getMessagesByChatId(chatId);
      const conversationHistory: z.infer<typeof messageWithRole>[] = previousMessages.map(msg => ({
        role: msg.role as any,
        content: msg.content,
        sources: msg.sources as any
      }));
      
      // Process the query through the RAG service
      const { content, sources } = await ragService.processQuery(
        chatId,
        parseResult.data.content,
        conversationHistory
      );
      
      res.json({
        role: "assistant",
        content,
        sources
      });
    } catch (error) {
      console.error(`Error processing message for chat ${req.params.id}:`, error);
      res.status(500).json({ 
        message: "Failed to process message",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Create a new chat with first message
  app.post("/api/chat", async (req: Request, res: Response) => {
    try {
      // Validate the request
      const chatRequestSchema = z.object({
        message: z.string().min(1, "Message content is required"),
        title: z.string().optional(),
      });
      
      const parseResult = chatRequestSchema.safeParse(req.body);
      
      if (!parseResult.success) {
        return res.status(400).json({ 
          message: "Invalid request data", 
          errors: parseResult.error.errors 
        });
      }
      
      // Create a new chat
      const title = parseResult.data.title || "New Chat";
      const chat = await storage.createChat({ title, userId: 1 }); // Default user for now
      
      // Process the message through the RAG service
      const { content, sources } = await ragService.processQuery(
        chat.id,
        parseResult.data.message,
        []
      );
      
      res.status(201).json({
        chatId: chat.id,
        message: {
          role: "assistant",
          content,
          sources
        }
      });
    } catch (error) {
      console.error("Error creating new chat with message:", error);
      res.status(500).json({ 
        message: "Failed to create chat and process message",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
