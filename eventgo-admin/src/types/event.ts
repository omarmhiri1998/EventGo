export type EventCategory =
  | "music"
  | "sports"
  | "technology"
  | "food"
  | "art"
  | "business"
  | "nightlife"
  | "festivals"
  | "cinema"
  | "comedy"
  | "culture"
  | "wellness";

export interface Event {
  id: string;
  title: string;
  description: string;
  category: EventCategory;
  city: string;
  date: string;
  time: string;
  image: string;
  isDemo: boolean;
  distanceKm?: number;
  cityLatitude?: number;
  cityLongitude?: number;
}