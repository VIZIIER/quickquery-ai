
export interface GroundingSource {
  title: string;
  uri: string;
}

export interface SearchResult {
  id: string;
  query: string;
  answer: string;
  sources: GroundingSource[];
  timestamp: number;
}

export interface AppState {
  history: SearchResult[];
  currentResult: SearchResult | null;
  isLoading: boolean;
  error: string | null;
}
