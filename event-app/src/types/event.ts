
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
  venue?: string | null;

  date: string;
  time: string;

  price?: number | null;
  currency?: "EUR";

  image: string;

  distanceKm?: number;
  ticketsLeft?: number;

  isDemo?: boolean;

  cityLatitude?: number;
  cityLongitude?: number;
}

export interface EventFilters {
  city: string;
  radius: number;
  date: string;
  category: EventCategory | "all";
}
