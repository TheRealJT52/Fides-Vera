import { Document, SourceReference } from "@shared/schema";

// Simple vector type
interface DocumentVector {
  document: Document;
  vector: number[];
}

/**
 * A simple in-memory vector store for document embeddings
 * In a production environment, this would be replaced with a proper vector DB
 */
export class VectorStore {
  private documentVectors: DocumentVector[] = [];

  /**
   * Add a document with its embedding vector to the store
   */
  addDocumentVector(document: Document, vector: number[]): void {
    this.documentVectors.push({ document, vector });
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
   * Get all documents in the store
   */
  getAllDocuments(): Document[] {
    return this.documentVectors.map(({ document }) => document);
  }
}

// Create a singleton instance
export const vectorStore = new VectorStore();
