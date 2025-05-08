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

  constructor() {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      throw new Error("GROQ_API_KEY environment variable is not set");
    }
    this.apiKey = apiKey;
  }

  /**
   * Get a chat completion from Groq API
   */
  async getChatCompletion(
    messages: MessageWithRole[],
    temperature: number = 0.5,
    max_tokens: number = 2048
  ): Promise<string> {
    const url = `${this.baseUrl}/chat/completions`;
    
    const params: GroqChatCompletionParams = {
      messages,
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
      throw error;
    }
  }

  /**
   * Get text embeddings from Groq API
   */
  async getEmbedding(text: string): Promise<number[]> {
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
      throw error;
    }
  }
}

// Export a singleton instance
export const groqService = new GroqService();
