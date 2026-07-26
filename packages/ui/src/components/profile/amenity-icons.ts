// ─────────────────────────────────────────────────────────────────────────────
// Amenity-key → lucide icon mapping.
// The taxonomy itself lives in @kshuri/api-client/types so every dashboard
// shares the same keys + labels + groups; only the icon choice is local to
// the UI package (keeps the api-client React-free).
// ─────────────────────────────────────────────────────────────────────────────
import type { LucideIcon } from "lucide-react";
import {
  Accessibility, Award, Banknote, Bath, Baby, BookOpen, Calendar, Car,
  Coffee, CreditCard, Dog, DoorClosed, DoorOpen, Droplet, Gift, Heart,
  Music, Plug, Shirt, Smartphone, Snowflake, Sparkles, Wifi,
} from "lucide-react";

const FALLBACK: LucideIcon = Sparkles;

const ICONS: Record<string, LucideIcon> = {
  wifi: Wifi,
  air_conditioning: Snowflake,
  music: Music,
  beverages: Coffee,
  water: Droplet,
  magazines: BookOpen,
  charging_station: Plug,
  private_rooms: DoorClosed,
  changing_room: Shirt,
  restroom: Bath,
  parking: Car,
  wheelchair_accessible: Accessibility,
  kid_friendly: Baby,
  pet_friendly: Dog,
  female_only: Heart,
  card_payment: CreditCard,
  upi_payment: Smartphone,
  cash_payment: Banknote,
  walk_ins_welcome: DoorOpen,
  online_booking: Calendar,
  gift_cards: Gift,
  loyalty_program: Award,
};

export function amenityIcon(key: string): LucideIcon {
  return ICONS[key] ?? FALLBACK;
}
