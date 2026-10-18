
import type { EventCategory } from "../types/event";

export interface Category {
  id: EventCategory;
  label: string;
  color: string;
}

export const categories: Category[] = [
  { id: "music", label: "Music", color: "#FFE5DE" },
  { id: "sports", label: "Sports", color: "#DAF5E4" },
  { id: "technology", label: "Technology", color: "#DFEFFF" },
  { id: "food", label: "Food", color: "#FFF0CC" },
  { id: "art", label: "Art", color: "#EEE4FF" },
  { id: "business", label: "Business", color: "#DCF5EF" },
  { id: "nightlife", label: "Nightlife", color: "#E8E1FF" },
  { id: "festivals", label: "Festivals", color: "#FFE2E6" },
  { id: "cinema", label: "Cinema", color: "#FFE8D6" },
  { id: "comedy", label: "Comedy", color: "#FFF3C4" },
  { id: "culture", label: "Culture", color: "#DCEBFF" },
  { id: "wellness", label: "Wellness", color: "#DDF5E5" },
];
