import { 
  User, InsertUser, 
  Chat, InsertChat, 
  Message, InsertMessage, 
  Document, InsertDocument, 
  SourceReference
} from "@shared/schema";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Chat methods
  getChat(id: number): Promise<Chat | undefined>;
  getChatsByUserId(userId: number): Promise<Chat[]>;
  createChat(chat: InsertChat): Promise<Chat>;
  updateChatTitle(id: number, title: string): Promise<Chat | undefined>;
  deleteChat(id: number): Promise<boolean>;
  
  // Message methods
  getMessage(id: number): Promise<Message | undefined>;
  getMessagesByChatId(chatId: number): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  
  // Document methods
  getDocument(id: number): Promise<Document | undefined>;
  getDocuments(): Promise<Document[]>;
  getDocumentsByCategory(category: string): Promise<Document[]>;
  createDocument(document: InsertDocument): Promise<Document>;
  searchDocuments(query: string): Promise<Document[]>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private chats: Map<number, Chat>;
  private messages: Map<number, Message>;
  private documents: Map<number, Document>;
  private currentIds: {
    users: number;
    chats: number;
    messages: number;
    documents: number;
  };

  // Constants for memory optimization
  private readonly MAX_CHATS_PER_USER = 25;
  private readonly MAX_MESSAGES_TOTAL = 500;
  
  constructor() {
    this.users = new Map();
    this.chats = new Map();
    this.messages = new Map();
    this.documents = new Map();
    this.currentIds = {
      users: 1,
      chats: 1,
      messages: 1,
      documents: 1,
    };
    
    // Initialize with some default documents
    this.initializeDocuments();
    
    // Set up more frequent cleanup to keep memory usage low
    // This is crucial for keeping memory usage down in auto-scale deployment
    setInterval(() => this.cleanupOldData(), 900000); // Run every 15 minutes
    
    // Log memory stats every hour
    setInterval(() => {
      console.log(`[MemStorage] Stats: Users=${this.users.size}, Chats=${this.chats.size}, Messages=${this.messages.size}, Documents=${this.documents.size}`);
    }, 3600000);
  }
  
  // Clean up old data to prevent memory bloat - both messages and chats
  private cleanupOldData(): void {
    this.cleanupOldMessages();
    this.cleanupOldChats();
    
    // If we still have too many messages total, delete the oldest ones
    if (this.messages.size > this.MAX_MESSAGES_TOTAL) {
      const allMessages = Array.from(this.messages.values());
      
      // Sort by creation time (oldest first)
      allMessages.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
      
      // Delete oldest messages to get down to our limit
      const toDelete = allMessages.slice(0, allMessages.length - this.MAX_MESSAGES_TOTAL);
      
      for (const message of toDelete) {
        this.messages.delete(message.id);
      }
      
      console.log(`[MemStorage] Deleted ${toDelete.length} oldest messages to stay under memory limit`);
    }
  }
  
  // Clean up old messages to prevent memory bloat
  private cleanupOldMessages(): void {
    const MAX_MESSAGES_PER_CHAT = 20; // Maximum messages to keep per chat
    
    // Messages by chat, using regular array operations to avoid TypeScript errors
    const chatsMap = new Map<number, Message[]>();
    const messageArray = Array.from(this.messages.values());
    
    // Group messages by chat
    messageArray.forEach(message => {
      if (!chatsMap.has(message.chatId)) {
        chatsMap.set(message.chatId, []);
      }
      const chatMessages = chatsMap.get(message.chatId);
      if (chatMessages) {
        chatMessages.push(message);
      }
    });
    
    // Process each chat's messages
    chatsMap.forEach((messages, chatId) => {
      if (messages.length <= MAX_MESSAGES_PER_CHAT) return;
      
      // Sort messages by creation time (newest first)
      messages.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      
      // Keep only the most recent messages per chat
      const toDelete = messages.slice(MAX_MESSAGES_PER_CHAT);
      
      // Delete older messages
      for (const message of toDelete) {
        this.messages.delete(message.id);
      }
    });
  }
  
  // Clean up old chats to prevent memory bloat
  private cleanupOldChats(): void {
    // Get chats by user
    const userChats = new Map<number, Chat[]>();
    
    Array.from(this.chats.values()).forEach(chat => {
      const userId = chat.userId || 1; // Default to user 1 if undefined
      if (!userChats.has(userId)) {
        userChats.set(userId, []);
      }
      const chats = userChats.get(userId);
      if (chats) {
        chats.push(chat);
      }
    });
    
    // For each user, limit the number of chats
    userChats.forEach((chats, userId) => {
      if (chats.length <= this.MAX_CHATS_PER_USER) return;
      
      // Sort chats by date (newest first)
      chats.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      
      // Delete older chats beyond the limit
      const toDelete = chats.slice(this.MAX_CHATS_PER_USER);
      
      for (const chat of toDelete) {
        // Delete all messages for this chat first
        Array.from(this.messages.values()).forEach(msg => {
          if (msg.chatId === chat.id) {
            this.messages.delete(msg.id);
          }
        });
        
        // Delete the chat
        this.chats.delete(chat.id);
      }
      
      console.log(`[MemStorage] Deleted ${toDelete.length} old chats for user ${userId}`);
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentIds.users++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Chat methods
  async getChat(id: number): Promise<Chat | undefined> {
    return this.chats.get(id);
  }

  async getChatsByUserId(userId: number): Promise<Chat[]> {
    return Array.from(this.chats.values()).filter(
      (chat) => chat.userId === userId,
    );
  }

  async createChat(insertChat: InsertChat): Promise<Chat> {
    const id = this.currentIds.chats++;
    const chat: Chat = { 
      ...insertChat, 
      id, 
      createdAt: new Date() 
    };
    this.chats.set(id, chat);
    return chat;
  }

  async updateChatTitle(id: number, title: string): Promise<Chat | undefined> {
    const chat = this.chats.get(id);
    if (!chat) return undefined;
    
    const updatedChat = { ...chat, title };
    this.chats.set(id, updatedChat);
    return updatedChat;
  }

  async deleteChat(id: number): Promise<boolean> {
    // Delete all messages associated with this chat
    const chatMessages = await this.getMessagesByChatId(id);
    for (const message of chatMessages) {
      this.messages.delete(message.id);
    }
    
    return this.chats.delete(id);
  }

  // Message methods
  async getMessage(id: number): Promise<Message | undefined> {
    return this.messages.get(id);
  }

  async getMessagesByChatId(chatId: number): Promise<Message[]> {
    // Only return the most recent messages to reduce memory usage in production
    return Array.from(this.messages.values())
      .filter((message) => message.chatId === chatId)
      .sort((a, b) => {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      })
      .slice(-5); // Only keep the 5 most recent messages
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const id = this.currentIds.messages++;
    const message: Message = { 
      ...insertMessage, 
      id, 
      createdAt: new Date() 
    };
    this.messages.set(id, message);
    return message;
  }

  // Document methods
  async getDocument(id: number): Promise<Document | undefined> {
    return this.documents.get(id);
  }

  async getDocuments(): Promise<Document[]> {
    return Array.from(this.documents.values());
  }

  async getDocumentsByCategory(category: string): Promise<Document[]> {
    return Array.from(this.documents.values()).filter(
      (doc) => doc.category === category,
    );
  }

  async createDocument(insertDocument: InsertDocument): Promise<Document> {
    const id = this.currentIds.documents++;
    const document: Document = { ...insertDocument, id };
    this.documents.set(id, document);
    return document;
  }

  async searchDocuments(query: string): Promise<Document[]> {
    // Simple search implementation - in a real app, this would use vector search
    const lowerQuery = query.toLowerCase();
    return Array.from(this.documents.values()).filter(
      (doc) => 
        doc.title.toLowerCase().includes(lowerQuery) || 
        doc.content.toLowerCase().includes(lowerQuery)
    );
  }

  // Helper method to initialize documents
  private initializeDocuments() {
    const catechismDocument: InsertDocument = {
      title: "Catechism of the Catholic Church",
      content: "The Catechism of the Catholic Church is a comprehensive summary of Catholic faith, morals, and doctrine. It serves as a reference text for teaching Catholic doctrine.",
      source: "Vatican",
      category: "Catechism",
      metadata: { year: 1992 }
    };
    
    const vaticanIIDocument: InsertDocument = {
      title: "Vatican II Documents",
      content: "The Second Vatican Council (Vatican II) was an ecumenical council of the Catholic Church convened by Pope John XXIII and closed by Pope Paul VI. Its documents represent a major turning point in the modern Church.",
      source: "Vatican",
      category: "Council Documents",
      metadata: { year: "1962-1965" }
    };
    
    const papalEncyclicals: InsertDocument = {
      title: "Papal Encyclicals",
      content: "Papal encyclicals are letters addressed by the Pope to Catholic bishops throughout the world, typically concerning matters of Catholic doctrine and morals.",
      source: "Vatican",
      category: "Encyclicals",
      metadata: { type: "official teaching" }
    };
    
    const saintsLives: InsertDocument = {
      title: "Lives of the Saints",
      content: "The lives of Catholic saints serve as models of Christian virtue and examples of faith in action.",
      source: "Catholic Tradition",
      category: "Saints",
      metadata: { type: "biographical" }
    };
    
    const scriptureReferences: InsertDocument = {
      title: "Scripture References",
      content: "The Bible is foundational to Catholic teaching, and Scripture references help to ground Church teaching in the revealed Word of God.",
      source: "Holy Bible",
      category: "Scripture",
      metadata: { type: "sacred text" }
    };
    
    this.createDocument(catechismDocument);
    this.createDocument(vaticanIIDocument);
    this.createDocument(papalEncyclicals);
    this.createDocument(saintsLives);
    this.createDocument(scriptureReferences);
  }
}

export const storage = new MemStorage();
