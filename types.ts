export interface ImageAsset {
  id: string;
  url: string; // Used for display
  base64?: string; // Used for API
  type: 'preset' | 'upload' | 'generated';
}

export interface HistoryItem {
  id: string;
  personImage: string;
  clothingImage: string;
  resultImage: string;
  timestamp: number;
}

export enum Step {
  SelectPerson = 1,
  SelectClothing = 2,
  Result = 3,
}

export type LoadingState = 'idle' | 'generating_clothing' | 'generating_tryon' | 'converting_preset';