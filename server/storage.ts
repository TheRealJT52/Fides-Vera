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
    return Array.from(this.messages.values())
      .filter((message) => message.chatId === chatId)
      .sort((a, b) => {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      });
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
