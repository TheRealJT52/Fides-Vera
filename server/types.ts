// Custom type definitions to work around schema inference issues

export interface ExplicitInsertChat {
  title: string;
  userId?: number | null;
}

export interface ExplicitChat {
  id: number;
  title: string;
  userId: number | null;
  createdAt: Date;
}

export interface ExplicitInsertMessage {
  chatId: number;
  role: string;
  content: string;
  sources?: any;
}

export interface ExplicitMessage {
  id: number;
  chatId: number;
  role: string;
  content: string;
  createdAt: Date;
  sources: any | null;
}

export interface ExplicitInsertDocument {
  title: string;
  content: string;
  source: string;
  category: string;
  metadata?: any;
}

export interface ExplicitDocument {
  id: number;
  title: string;
  content: string;
  source: string;
  category: string;
  metadata: any | null;
}