import { MessageWithRole, SourceReference } from "@shared/schema";

interface GroqChatCompletionParams {
  messages: MessageWithRole[];
  model: string;
  temperature?: number;
  max_tokens?: number;
}

interface GroqChatCompletionResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: {
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

// Text embedding parameters
interface GroqEmbeddingParams {
  input: string;
  model: string;
}

// Text embedding response
interface GroqEmbeddingResponse {
  object: string;
  data: {
    object: string;
    embedding: number[];
    index: number;
  }[];
  model: string;
  usage: {
    prompt_tokens: number;
    total_tokens: number;
  };
}

export class GroqService {
  private apiKey: string;
  private chatModel: string = "llama3-70b-8192";
  private embeddingModel: string = "text-embedding-ada-002";
  private baseUrl: string = "https://api.groq.com/openai/v1";
  
  // Simple cache to avoid redundant API calls
  private completionCache: Map<string, string> = new Map();
  private embeddingCache: Map<string, number[]> = new Map();
  
  // Cache size limits 
  private readonly MAX_COMPLETION_CACHE_SIZE = 100;
  private readonly MAX_EMBEDDING_CACHE_SIZE = 500;

  constructor() {
    const apiKey = process.env.GROQ_API_KEY;
    
    // In GitHub environments, we want to warn but not crash if the API key isn't set
    // This allows running tests and other operations without the actual API key
    if (!apiKey) {
      console.warn("WARNING: GROQ_API_KEY environment variable is not set.");
      console.warn("The application may not function correctly without a valid API key.");
      console.warn("Please add your GROQ_API_KEY to your environment variables or .env file.");
      
      // Use a placeholder value in development mode to allow the app to start
      // This will obviously not work for real API calls
      this.apiKey = process.env.NODE_ENV === 'development' ? 'development_placeholder_key' : '';
    } else {
      this.apiKey = apiKey;
    }
    
    // Log cache status every hour to monitor usage
    setInterval(() => {
      console.log(`[GroqService] Cache status - Completions: ${this.completionCache.size}/${this.MAX_COMPLETION_CACHE_SIZE}, Embeddings: ${this.embeddingCache.size}/${this.MAX_EMBEDDING_CACHE_SIZE}`);
    }, 60 * 60 * 1000);
  }

  /**
   * Get a chat completion from Groq API
   */
  async getChatCompletion(
    messages: MessageWithRole[],
    temperature: number = 0.5,
    max_tokens: number = 2048
  ): Promise<string> {
    // Check if we're in development with no API key (GitHub environment without secrets)
    if (this.apiKey === 'development_placeholder_key') {
      console.warn("Using mock response due to missing GROQ_API_KEY");
      return "This is a placeholder response. To get real responses, please set up your GROQ_API_KEY in your environment variables or .env file.";
    }
    
    const url = `${this.baseUrl}/chat/completions`;
    
    // Check for empty API key
    if (!this.apiKey) {
      throw new Error("Cannot make API call: GROQ_API_KEY is not set");
    }
    
    // Filter out 'sources' property from messages to prevent Groq API errors
    const cleanedMessages = messages.map(msg => ({
      role: msg.role,
      content: msg.content
      // Exclude 'sources' property as Groq API doesn't accept it
    }));
    
    const params: GroqChatCompletionParams = {
      messages: cleanedMessages,
      model: this.chatModel,
      temperature,
      max_tokens,
    };

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${this.apiKey}`
        },
        body: JSON.stringify(params)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Groq API error: ${response.status} ${errorText}`);
      }

      const data: GroqChatCompletionResponse = await response.json();
      return data.choices[0].message.content;
    } catch (error) {
      console.error("Error calling Groq API:", error);
      
      // More helpful error message for GitHub environments
      if (process.env.NODE_ENV === 'development' && !process.env.GROQ_API_KEY) {
        throw new Error("Groq API key not configured. Please add GROQ_API_KEY to your environment variables or .env file.");
      }
      
      throw error;
    }
  }

  /**
   * Get text embeddings from Groq API
   */
  async getEmbedding(text: string): Promise<number[]> {
    // Check if we're in development with no API key (GitHub environment without secrets)
    if (this.apiKey === 'development_placeholder_key') {
      console.warn("Using mock embeddings due to missing GROQ_API_KEY");
      // Return a small random vector for development purposes
      return Array(10).fill(0).map(() => Math.random());
    }
    
    // Check for empty API key
    if (!this.apiKey) {
      throw new Error("Cannot make API call: GROQ_API_KEY is not set");
    }
    
    const url = `${this.baseUrl}/embeddings`;
    
    const params: GroqEmbeddingParams = {
      input: text,
      model: this.embeddingModel
    };

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${this.apiKey}`
        },
        body: JSON.stringify(params)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Groq API error: ${response.status} ${errorText}`);
      }

      const data: GroqEmbeddingResponse = await response.json();
      return data.data[0].embedding;
    } catch (error) {
      console.error("Error getting embeddings from Groq API:", error);
      
      // More helpful error message for GitHub environments
      if (process.env.NODE_ENV === 'development' && !process.env.GROQ_API_KEY) {
        throw new Error("Groq API key not configured. Please add GROQ_API_KEY to your environment variables or .env file.");
      }
      
      throw error;
    }
  }
}

// Export a singleton instance
export const groqService = new GroqService();
