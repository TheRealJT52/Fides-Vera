import { MessageWithRole, Document, SourceReference } from "@shared/schema";
import { groqService } from "./groqService";
import { vectorStore } from "./vectorStore";
import { storage } from "../storage";

export class RAGService {
  // System prompt to guide the assistant to provide Catholic-aligned responses
  private systemPrompt = `
You are Fides Vera, a personal Catholic teaching assistant. Your purpose is to help users explore Catholic teachings, 
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

CITATION RULES - FOLLOW THESE EXACTLY:
- When citing the Catechism, always use the exact paragraph numbers provided in the source metadata.
  Format: "Catechism of the Catholic Church, [paragraph number(s)]"
  Example: "Catechism of the Catholic Church, 1730-1732"
  
- When citing Vatican II documents, include the document name and section number if available.
  Format: "[Document Name], [Section Number]"
  Example: "Lumen Gentium, 14"
  
- When citing Papal Encyclicals, include the title, pope's name, and year.
  Format: "[Title], Pope [Name], [Year]"
  Example: "Humanae Vitae, Pope Paul VI, 1968"
  
- When citing Scripture, use standard book, chapter, and verse notation.
  Format: "[Book] [Chapter]:[Verse]"
  Example: "Matthew 5:44-45"
  
- NEVER make up or paraphrase document citations. Only cite the exact sources given to you.
- NEVER cite section numbers that aren't explicitly mentioned in the source metadata.
- If you're not 100% certain of a specific citation, simply refer to the document more generally.

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
      
      // Prepare context with relevant documents - truncate content if too long
      // to reduce token usage when sending to the LLM
      const contextStr = relevantSources
        .map(doc => {
          // Limit content length to reduce token usage (approx 1000 chars)
          const content = doc.content || '';
          const truncatedContent = content.length > 1000 
            ? content.substring(0, 1000) + "..." 
            : content;
            
          // Get document metadata for more specific citation information
          const document = vectorStore.getDocumentById(doc.id);
          let metadataStr = '';
          
          if (document?.metadata) {
            // Format metadata differently based on document category
            if (doc.category === 'Catechism') {
              metadataStr = `\nSection: ${document.metadata.section || ''}\nParagraphs: ${document.metadata.paragraphs || ''}\nYear: ${document.metadata.year || ''}`;
            } else if (doc.category === 'Council Documents') {
              metadataStr = `\nDocument: ${document.metadata.document || ''}\nType: ${document.metadata.type || ''}\nYear: ${document.metadata.year || ''}`;
            } else if (doc.category === 'Encyclicals') {
              metadataStr = `\nPope: ${document.metadata.pope || ''}\nYear: ${document.metadata.year || ''}\nType: ${document.metadata.type || ''}`;
            } else if (doc.category === 'Saints') {
              metadataStr = `\nLifespan: ${document.metadata.lifespan || ''}\nFeast Day: ${document.metadata.feast || ''}\nTitle: ${document.metadata.title || ''}`;
            } else if (doc.category === 'Scripture') {
              metadataStr = `\nTestament: ${document.metadata.testament || ''}\nBooks: ${document.metadata.books || ''}\nType: ${document.metadata.type || ''}`;
            }
          }
          
          return `Document: ${doc.title}\nContent: ${truncatedContent}\nSource: ${doc.source}\nCategory: ${doc.category || ''}${metadataStr}\n`;
        })
        .join("\n");
      
      // Limit conversation history to recent messages to reduce token usage
      // Only include the last 5 messages
      const limitedHistory = conversationHistory.slice(-5);
      
      // Prepare messages for LLM
      const messages: MessageWithRole[] = [
        { role: "system", content: this.systemPrompt + "\n\nRelevant context:\n" + contextStr },
        ...limitedHistory,
        { role: "user", content: query }
      ];
      
      // Get response from Groq
      const response = await groqService.getChatCompletion(messages, 0.5, 1500);
      
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
