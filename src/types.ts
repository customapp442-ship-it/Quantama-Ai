export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  status?: 'sending' | 'streaming' | 'complete' | 'error';
}

export interface ChatSession {
  id: string;
  title: string;
  createdAt: number;
  messages: ChatMessage[];
}
