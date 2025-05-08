import { MessageWithRole, Document, SourceReference } from "@shared/schema";
import { groqService } from "./groqService";
import { vectorStore } from "./vectorStore";
import { storage } from "../storage";

export class RAGService {
  // System prompt to guide the assistant to provide Catholic-aligned responses
  private systemPrompt = `
You are Fides, a Catholic teaching assistant. Your purpose is to help users explore Catholic teachings, 
doctrine, and tradition using authentic Catholic sources. Always respond in a way that is:

1. Faithful to the Magisterium and Catholic doctrine
2. Clear and accessible for all users, regardless of their familiarity with Catholicism
3. Compassionate and respectful
4. Based on authoritative Catholic sources
5. Well-cited with references to sources

When responding to questions about Catholic teaching, prioritize:
- The Bible (Sacred Scripture)
- The Catechism of the Catholic Church
- Papal encyclicals and apostolic exhortations
- Vatican II documents
- Writings of Church Fathers and Doctors of the Church
- Lives and teachings of the Saints

Always include citations when referencing specific teachings.

If you don't know the answer or if a question is outside the scope of Catholic teaching, acknowledge this 
and recommend consulting a priest, spiritual director, or other appropriate resource.

Remember that you are not a replacement for pastoral care or spiritual direction, and you should note this 
when appropriate.
`;

  constructor() {
    // Initialize the vector store with documents
    this.initializeVectorStore();
  }

  /**
   * Initialize the vector store with documents from storage
   */
  private async initializeVectorStore(): Promise<void> {
    try {
      const documents = await storage.getDocuments();
      
      // Store documents without embeddings for keyword search fallback
      for (const document of documents) {
        // Add the document to the vector store without embeddings
        // We'll use a fallback search method when embeddings aren't available
        vectorStore.addDocumentWithoutEmbedding(document);
      }
      
      console.log(`Document store initialized with ${documents.length} documents`);
    } catch (error) {
      console.error("Failed to initialize document store:", error);
    }
  }

  /**
   * Process a user query and generate a response with relevant sources
   */
  async processQuery(
    chatId: number,
    query: string, 
    conversationHistory: MessageWithRole[] = []
  ): Promise<{ content: string; sources: SourceReference[] }> {
    try {
      // Search for relevant documents using keyword search
      const relevantSources = vectorStore.searchByKeywords(query, 3);
      
      // Prepare context with relevant documents
      const contextStr = relevantSources
        .map(doc => `Document: ${doc.title}\nContent: ${doc.content}\nSource: ${doc.source}\n`)
        .join("\n");
      
      // Prepare messages for LLM
      const messages: MessageWithRole[] = [
        { role: "system", content: this.systemPrompt + "\n\nRelevant context:\n" + contextStr },
        ...conversationHistory,
        { role: "user", content: query }
      ];
      
      // Get response from Groq
      const response = await groqService.getChatCompletion(messages);
      
      // Save the user message and response to storage
      await storage.createMessage({
        chatId,
        role: "user",
        content: query,
        sources: null
      });
      
      await storage.createMessage({
        chatId,
        role: "assistant",
        content: response,
        sources: relevantSources
      });
      
      return { 
        content: response, 
        sources: relevantSources 
      };
    } catch (error) {
      console.error("Error processing query:", error);
      throw error;
    }
  }
}

// Export a singleton instance
export const ragService = new RAGService();
