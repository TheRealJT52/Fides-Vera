import { Document, SourceReference } from "@shared/schema";

// Simple vector type
interface DocumentVector {
  document: Document;
  vector: number[];
}

/**
 * A simple in-memory store for documents and their vectors
 * In a production environment, this would be replaced with a proper vector DB
 */
export class VectorStore {
  private documentVectors: DocumentVector[] = [];
  private documents: Document[] = []; // Store documents without embeddings

  /**
   * Add a document with its embedding vector to the store
   */
  addDocumentVector(document: Document, vector: number[]): void {
    this.documentVectors.push({ document, vector });
    // Also add to regular document store for keyword search
    this.documents.push(document);
  }

  /**
   * Add a document without embedding for keyword search
   */
  addDocumentWithoutEmbedding(document: Document): void {
    this.documents.push(document);
  }

  /**
   * Calculate cosine similarity between two vectors
   */
  private cosineSimilarity(vecA: number[], vecB: number[]): number {
    if (vecA.length !== vecB.length) {
      throw new Error("Vectors must be of the same length");
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }

    if (normA === 0 || normB === 0) {
      return 0;
    }

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  /**
   * Search for the most similar documents to the given query vector
   */
  searchSimilarDocuments(queryVector: number[], limit: number = 5): SourceReference[] {
    // If no document vectors available, fall back to keyword search
    if (this.documentVectors.length === 0) {
      return this.searchByKeywords("", limit);
    }

    const results = this.documentVectors.map(({ document, vector }) => {
      const score = this.cosineSimilarity(queryVector, vector);
      return {
        id: document.id,
        title: document.title,
        content: document.content,
        source: document.source,
        category: document.category,
        relevanceScore: score,
      };
    });

    // Sort by similarity score in descending order
    return results
      .sort((a, b) => b.relevanceScore! - a.relevanceScore!)
      .slice(0, limit);
  }

  /**
   * Search for documents containing keywords from the query
   * A simple alternative when vector embeddings aren't available
   */
  searchByKeywords(query: string, limit: number = 5): SourceReference[] {
    // If query is empty, return random documents
    if (!query.trim()) {
      return this.documents.slice(0, limit).map(doc => ({
        id: doc.id,
        title: doc.title,
        content: doc.content,
        source: doc.source,
        category: doc.category,
        relevanceScore: 1.0, // Default high score
      }));
    }

    // Split query into keywords
    const keywords = query.toLowerCase().split(/\s+/);
    
    // Score documents based on keyword matches
    const results = this.documents.map(document => {
      const documentText = `${document.title} ${document.content}`.toLowerCase();
      
      // Count keyword matches
      let matchCount = 0;
      for (const keyword of keywords) {
        if (keyword.length > 2 && documentText.includes(keyword)) {
          matchCount++;
        }
      }
      
      // Calculate score based on match percentage
      const score = keywords.length > 0 ? matchCount / keywords.length : 0;
      
      return {
        id: document.id,
        title: document.title,
        content: document.content,
        source: document.source,
        category: document.category, 
        relevanceScore: score
      };
    });

    // Sort by score and take top results
    return results
      .sort((a, b) => b.relevanceScore! - a.relevanceScore!)
      .slice(0, limit);
  }

  /**
   * Get all documents in the store
   */
  getAllDocuments(): Document[] {
    return this.documents;
  }
}

// Create a singleton instance
export const vectorStore = new VectorStore();
