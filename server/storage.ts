import { 
  User, InsertUser, 
  SourceReference
} from "@shared/schema";

import {
  ExplicitChat as Chat,
  ExplicitInsertChat as InsertChat,
  ExplicitMessage as Message,
  ExplicitInsertMessage as InsertMessage,
  ExplicitDocument as Document,
  ExplicitInsertDocument as InsertDocument
} from "./types";

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
    
    // Type checking for required fields
    if (typeof insertChat.title !== 'string') {
      throw new Error('title is required and must be a string');
    }
    
    // Create a properly typed Chat object
    const chat: Chat = { 
      id, 
      title: insertChat.title,
      userId: (insertChat as any).userId !== undefined ? (insertChat as any).userId : null,
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
    
    // Type checking for required fields
    if (typeof insertMessage.chatId !== 'number') {
      throw new Error('chatId is required and must be a number');
    }
    if (typeof insertMessage.role !== 'string') {
      throw new Error('role is required and must be a string');
    }
    if (typeof insertMessage.content !== 'string') {
      throw new Error('content is required and must be a string');
    }

    // Create a properly typed Message object
    const message: Message = { 
      id,
      chatId: insertMessage.chatId,
      role: insertMessage.role,
      content: insertMessage.content,
      createdAt: new Date(),
      sources: insertMessage.sources ?? null
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
    
    // Type checking for required fields
    if (typeof insertDocument.title !== 'string') {
      throw new Error('title is required and must be a string');
    }
    if (typeof insertDocument.content !== 'string') {
      throw new Error('content is required and must be a string');
    }
    if (typeof insertDocument.source !== 'string') {
      throw new Error('source is required and must be a string');
    }
    if (typeof insertDocument.category !== 'string') {
      throw new Error('category is required and must be a string');
    }
    
    // Create a properly typed Document object
    const document: Document = { 
      id,
      title: insertDocument.title,
      content: insertDocument.content,
      source: insertDocument.source,
      category: insertDocument.category,
      metadata: (insertDocument as any).metadata || null
    };
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
    // Create multiple Catechism documents with specific sections
    const catechismPart1 = {
      title: "Catechism of the Catholic Church: Part 1 - The Profession of Faith",
      content: "Part One of the Catechism explores the Profession of Faith, including the Apostles' Creed and the nature of faith. Sections 26-184 cover 'Man's Capacity for God' and 'God Comes to Meet Man'. Sections 185-1065 cover 'The Creeds' including beliefs about the Trinity, Creation, Jesus Christ, and the Holy Spirit.",
      source: "Vatican",
      category: "Catechism",
      metadata: { 
        year: 1992,
        section: "Part One (26-1065)",
        paragraphs: "26-1065"
      }
    } as InsertDocument;
    
    const catechismPart2 = {
      title: "Catechism of the Catholic Church: Part 2 - The Celebration of the Christian Mystery",
      content: "Part Two of the Catechism covers the Church's liturgy and the seven sacraments. Sections 1066-1209 explain the meaning and purpose of the liturgy. Sections 1210-1690 detail each of the seven sacraments: Baptism, Confirmation, Eucharist, Penance, Anointing of the Sick, Holy Orders, and Matrimony.",
      source: "Vatican", 
      category: "Catechism",
      metadata: {
        year: 1992,
        section: "Part Two (1066-1690)",
        paragraphs: "1066-1690"
      }
    } as InsertDocument;
    
    const catechismPart3 = {
      title: "Catechism of the Catholic Church: Part 3 - Life in Christ",
      content: "Part Three of the Catechism explores Christian morality and ethical living. Sections 1691-1876 cover man's vocation to life in the Spirit. Sections 1877-2051 explain the Ten Commandments and living in community. Sections 2052-2557 provide detailed explanations of each of the Ten Commandments and their moral implications.",
      source: "Vatican",
      category: "Catechism",
      metadata: {
        year: 1992,
        section: "Part Three (1691-2557)",
        paragraphs: "1691-2557"
      }
    } as InsertDocument;
    
    const catechismPart4 = {
      title: "Catechism of the Catholic Church: Part 4 - Christian Prayer",
      content: "Part Four of the Catechism focuses on prayer in the Christian life. Sections 2558-2649 cover the nature and importance of prayer. Sections 2650-2696 discuss the tradition of prayer in the Church. Sections 2697-2758 explain the life of prayer, including vocal prayer, meditation, and contemplation. Sections 2759-2865 provide a detailed examination of the Lord's Prayer.",
      source: "Vatican",
      category: "Catechism",
      metadata: {
        year: 1992,
        section: "Part Four (2558-2865)",
        paragraphs: "2558-2865"
      }
    } as InsertDocument;
    
    // Vatican II document split by major constitutions
    const vaticanIILumenGentium = {
      title: "Vatican II: Lumen Gentium (Dogmatic Constitution on the Church)",
      content: "Lumen Gentium, the Dogmatic Constitution on the Church, explains the Church's nature as a sacrament of communion with God and unity among all people. It elaborates on the Church as the People of God, the hierarchical structure, the role of the laity, the universal call to holiness, and Mary's role in the Church.",
      source: "Vatican",
      category: "Council Documents",
      metadata: { 
        year: "1964",
        document: "Lumen Gentium",
        type: "Dogmatic Constitution"
      }
    } as InsertDocument;
    
    const vaticanIIDeiVerbum = {
      title: "Vatican II: Dei Verbum (Dogmatic Constitution on Divine Revelation)",
      content: "Dei Verbum, the Dogmatic Constitution on Divine Revelation, addresses the relationship between scripture and tradition, the inspiration and interpretation of scripture, the Old and New Testaments, and scripture's place in the life of the Church.",
      source: "Vatican",
      category: "Council Documents",
      metadata: { 
        year: "1965",
        document: "Dei Verbum",
        type: "Dogmatic Constitution"
      }
    } as InsertDocument;
    
    // Papal Encyclicals with specific documents
    const papalDiviniRedemptoris = {
      title: "Divini Redemptoris (On Atheistic Communism)",
      content: "Pope Pius XI's 1937 encyclical condemning atheistic communism and explaining Catholic social teaching as the remedy to communism's errors. It offers Christian principles of social order, emphasizing justice, charity, and human dignity.",
      source: "Pope Pius XI",
      category: "Encyclicals",
      metadata: { 
        year: 1937,
        pope: "Pius XI",
        type: "Social Encyclical"
      }
    } as InsertDocument;
    
    const papalHumanaeVitae = {
      title: "Humanae Vitae (On Human Life)",
      content: "Pope Paul VI's 1968 encyclical reaffirming the Church's teaching against artificial contraception. It explains the inseparable connection between the unitive and procreative aspects of marriage, and offers guidance on responsible parenthood and moral regulation of births.",
      source: "Pope Paul VI",
      category: "Encyclicals",
      metadata: { 
        year: 1968,
        pope: "Paul VI",
        type: "Moral Encyclical"
      }
    } as InsertDocument;
    
    // Saints documents with specific saints
    const saintAquinas = {
      title: "Saint Thomas Aquinas",
      content: "Saint Thomas Aquinas (1225-1274) was a Dominican friar and Doctor of the Church whose works combined faith and reason. His Summa Theologica systematically explains theology through natural reason illuminated by faith. He developed the 'Five Ways' to prove God's existence and advanced Catholic philosophy and theology.",
      source: "Catholic Tradition",
      category: "Saints",
      metadata: { 
        lifespan: "1225-1274",
        feast: "January 28",
        title: "Doctor of the Church"
      }
    } as InsertDocument;
    
    const saintTeresa = {
      title: "Saint Teresa of Ávila",
      content: "Saint Teresa of Ávila (1515-1582) was a Spanish Carmelite nun, mystic, and Doctor of the Church. She reformed the Carmelite Order and wrote influential spiritual works including 'The Interior Castle' and her autobiography. Her teachings on prayer and contemplation continue to guide Catholics in developing their spiritual lives.",
      source: "Catholic Tradition",
      category: "Saints",
      metadata: { 
        lifespan: "1515-1582",
        feast: "October 15",
        title: "Doctor of the Church"
      }
    } as InsertDocument;
    
    // Scripture documents by section
    const scriptureGospels = {
      title: "The Gospels",
      content: "The four Gospels—Matthew, Mark, Luke, and John—present the life, teachings, death, and resurrection of Jesus Christ. They form the heart of Scripture by revealing Jesus as the fulfillment of God's promises and the source of our salvation.",
      source: "Holy Bible",
      category: "Scripture",
      metadata: { 
        testament: "New Testament",
        books: "Matthew, Mark, Luke, John",
        type: "Gospel"
      }
    } as InsertDocument;
    
    const scripturePaulineLetters = {
      title: "Pauline Letters",
      content: "The letters attributed to Saint Paul address various early Christian communities, covering topics such as faith, salvation, the Church, and Christian moral life. They include Romans, 1 & 2 Corinthians, Galatians, Ephesians, Philippians, Colossians, 1 & 2 Thessalonians, 1 & 2 Timothy, Titus, and Philemon.",
      source: "Holy Bible",
      category: "Scripture",
      metadata: { 
        testament: "New Testament",
        author: "Saint Paul",
        type: "Epistle"
      }
    } as InsertDocument;
    
    const currentEvents = {
  title: "Current Papal Status",
  content: "Cardinal Robert Francis Prevost has been chosen as the 267th pope of the Catholic Church, taking the name Leo XIV, and proclaiming “Peace be with you all!” in his first greeting to the world. Pope Leo XIV, formerly Cardinal Robert Francis Prevost, appears on the loggia overlooking St. Peter’s Square on May 8, 2025.",
  source: "Vatican News",
  category: "Church News",
  metadata: {
    year: 2025,
    section: "Papal Office"
  }
} as InsertDocument;

this.createDocument(currentEvents);
    // Create more specific documents with section information
    this.createDocument(catechismPart1);
    this.createDocument(catechismPart2);
    this.createDocument(catechismPart3);
    this.createDocument(catechismPart4);
    
    this.createDocument(vaticanIILumenGentium);
    this.createDocument(vaticanIIDeiVerbum);
    
    this.createDocument(papalDiviniRedemptoris);
    this.createDocument(papalHumanaeVitae);
    
    this.createDocument(saintAquinas);
    this.createDocument(saintTeresa);
    
    this.createDocument(scriptureGospels);
    this.createDocument(scripturePaulineLetters);
  }
}

export const storage = new MemStorage();
