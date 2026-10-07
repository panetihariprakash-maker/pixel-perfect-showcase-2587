// Single centralized mock data source for the whole app (Week 1 demo).
import hero from "@/assets/hero.jpg";
import roomDeluxe from "@/assets/room-deluxe.jpg";
import roomPool from "@/assets/room-pool-villa.jpg";
import roomFamily from "@/assets/room-family.jpg";
import roomCottage from "@/assets/room-cottage.jpg";
import actTrek from "@/assets/act-trek.jpg";
import actWellness from "@/assets/act-wellness.jpg";
import actNature from "@/assets/act-nature.jpg";
import actAdventure from "@/assets/act-adventure.jpg";
import dining from "@/assets/dining.jpg";

export const images = { hero, dining };

export const resort = {
  name: "The Azure Ridge Sanctuary",
  tagline: "A hillside retreat above the clouds",
  description:
    "Perched at 1,800 m among pine forests and misty ridges, The Azure Ridge Sanctuary blends quiet luxury with guided treks, forest wellness and slow mountain dining.",
  about:
    "Founded in 2012 by a family of mountaineers, the Sanctuary sits on 40 acres of protected forest. Our 32 rooms, villas and treehouses are built from local stone and timber, run on 70% solar power, and are staffed by people from the valley below.",
  address: "Ridge Road, Coonoor Hills, Tamil Nadu 643101",
  phone: "+91 98765 43210",
  email: "stay@azureridge.example",
  checkInTime: "2:00 PM",
  checkOutTime: "11:00 AM",
};

export type RoomType = "Room" | "Suite" | "Villa" | "Cottage";
export interface Room {
  id: string;
  name: string;
  type: RoomType;
  image: string;
  price: number;
  capacity: number;
  size: string;
  facilities: string[];
  description: string;
  details: string;
  tags: string[]; // matches concierge interests
  inventory: number;
}

export const rooms: Room[] = [
  {
    id: "deluxe-valley",
    name: "Deluxe Valley Room",
    type: "Room",
    image: roomDeluxe,
    price: 8500,
    capacity: 2,
    size: "38 m²",
    facilities: ["King bed", "Valley-view window", "Rain shower", "Free Wi-Fi", "Tea station"],
    description: "Calm, timber-lined room with a floor-to-ceiling window over the misty valley.",
    details:
      "Ideal for couples and solo travellers. Includes daily breakfast at Cloudline Kitchen and evening turndown with herbal tea.",
    tags: ["Relaxation", "Nature"],
    inventory: 12,
  },
  {
    id: "family-suite",
    name: "Ridge Family Suite",
    type: "Suite",
    image: roomFamily,
    price: 14500,
    capacity: 5,
    size: "72 m²",
    facilities: ["2 queen beds", "Stone fireplace", "Lounge area", "Balcony", "Kids' welcome kit"],
    description: "Spacious suite with a fireplace lounge, balcony and room for the whole family.",
    details:
      "Connecting layout with two queen beds and a sofa bed. Board games, kids' menu and a guided family nature walk are included.",
    tags: ["Family", "Relaxation"],
    inventory: 8,
  },
  {
    id: "forest-treehouse",
    name: "Pine Canopy Treehouse",
    type: "Cottage",
    image: roomCottage,
    price: 11000,
    capacity: 2,
    size: "45 m²",
    facilities: ["Glass walls", "Canopy deck", "Outdoor shower", "Telescope", "Free Wi-Fi"],
    description: "A glass treehouse raised among tall pines, reached by a lantern-lit walkway.",
    details:
      "Perfect for nature lovers and early-morning trekkers. Bird-watching kit and sunrise trek briefing included.",
    tags: ["Nature", "Adventure", "Trekking"],
    inventory: 6,
  },
  {
    id: "infinity-pool-villa",
    name: "Infinity Pool Villa",
    type: "Villa",
    image: roomPool,
    price: 24000,
    capacity: 4,
    size: "110 m²",
    facilities: ["Private plunge pool", "Sunset deck", "Butler service", "In-villa dining", "Spa tub"],
    description: "Our signature villa with a private infinity plunge pool facing the sunset.",
    details:
      "Includes butler service, a private candlelit dinner on the deck and one complimentary spa ritual per stay.",
    tags: ["Relaxation", "Dining"],
    inventory: 6,
  },
];

export type ActivityType = "Trekking" | "Nature" | "Adventure" | "Wellness" | "Family" | "Sightseeing";
export type Difficulty = "Easy" | "Moderate" | "Challenging";
export interface Activity {
  id: string;
  name: string;
  type: ActivityType;
  image: string;
  description: string;
  duration: string;
  difficulty: Difficulty;
  suitableFor: string;
  price: number;
  slots: string[];
  interests: string[];
}

export const activities: Activity[] = [
  {
    id: "sunrise-ridge-trek",
    name: "Sunrise Ridge Trek",
    type: "Trekking",
    image: actTrek,
    description: "A guided pre-dawn climb to Azure Point to watch the sun rise over a sea of clouds.",
    duration: "4 hours",
    difficulty: "Challenging",
    suitableFor: "Fit adults 14+, prior hiking recommended",
    price: 1800,
    slots: ["4:30 AM"],
    interests: ["Trekking", "Adventure", "Nature"],
  },
  {
    id: "waterfall-trail",
    name: "Fern Valley Waterfall Trail",
    type: "Nature",
    image: actNature,
    description: "Gentle forest walk across wooden bridges to a hidden three-tier waterfall.",
    duration: "2.5 hours",
    difficulty: "Easy",
    suitableFor: "All ages, families with children 5+",
    price: 900,
    slots: ["8:00 AM", "3:00 PM"],
    interests: ["Nature", "Family", "Trekking"],
  },
  {
    id: "canopy-zipline",
    name: "Canopy Zipline Run",
    type: "Adventure",
    image: actAdventure,
    description: "Six linked ziplines over the pine valley, with a certified safety crew.",
    duration: "1.5 hours",
    difficulty: "Moderate",
    suitableFor: "Ages 10+, weight 30–110 kg",
    price: 2200,
    slots: ["10:00 AM", "2:00 PM"],
    interests: ["Adventure", "Family"],
  },
  {
    id: "misty-yoga",
    name: "Misty Deck Yoga & Breathwork",
    type: "Wellness",
    image: actWellness,
    description: "Slow flow yoga and guided breathing on the cliffside deck as the mist lifts.",
    duration: "1 hour",
    difficulty: "Easy",
    suitableFor: "All levels, ages 12+",
    price: 0,
    slots: ["6:30 AM", "5:30 PM"],
    interests: ["Relaxation"],
  },
  {
    id: "tea-estate-tour",
    name: "Heritage Tea Estate Tour",
    type: "Sightseeing",
    image: actNature,
    description: "Visit a 100-year-old tea estate, see the factory and taste five single-estate teas.",
    duration: "3 hours",
    difficulty: "Easy",
    suitableFor: "All ages",
    price: 1200,
    slots: ["11:00 AM"],
    interests: ["Dining", "Family", "Nature"],
  },
  {
    id: "junior-rangers",
    name: "Junior Forest Rangers",
    type: "Family",
    image: actTrek,
    description: "Kids learn tracking, bird calls and leaf craft with our resident naturalist.",
    duration: "2 hours",
    difficulty: "Easy",
    suitableFor: "Children 5–12 with a parent",
    price: 600,
    slots: ["9:30 AM"],
    interests: ["Family", "Nature"],
  },
];

export interface Facility {
  name: string;
  description: string;
  hours: string;
}
export const facilities: Facility[] = [
  { name: "Cliffside Infinity Pool", description: "Heated pool facing the valley.", hours: "7 AM – 8 PM" },
  { name: "Cedar Spa", description: "Ayurvedic and forest-herb therapies.", hours: "9 AM – 9 PM" },
  { name: "Fitness Pavilion", description: "Open-air gym with mountain views.", hours: "24 hours" },
  { name: "Kids' Nature Club", description: "Supervised play and crafts.", hours: "9 AM – 6 PM" },
  { name: "Library Lounge", description: "Fireplace, books and board games.", hours: "8 AM – 11 PM" },
  { name: "Airport Transfers", description: "Coimbatore airport pick-up on request.", hours: "On request" },
];

export interface Dining {
  name: string;
  cuisine: string;
  description: string;
  hours: string;
}
export const diningVenues: Dining[] = [
  { name: "Cloudline Kitchen", cuisine: "All-day · South Indian & global", description: "Breakfast buffet and à la carte with valley views.", hours: "7 AM – 10:30 PM" },
  { name: "Ember Terrace", cuisine: "Wood-fire grill", description: "Sunset dinners on the stone terrace.", hours: "6:30 PM – 11 PM" },
  { name: "The Tea Room", cuisine: "Estate teas & bakes", description: "High tea with single-estate Nilgiri teas.", hours: "3 PM – 6 PM" },
];

// ---------- Guests, bookings, front desk, operations ----------
export type BookingStatus = "Confirmed" | "Pending" | "Cancelled" | "Checked In" | "Checked Out";
export type PaymentStatus = "Paid" | "Payment Pending" | "Payment Ready/Test";

export interface Booking {
  id: string;
  guestId: string;
  guestName: string;
  email: string;
  phone: string;
  roomId: string;
  checkIn: string; // YYYY-MM-DD
  checkOut: string;
  guests: number;
  nights: number;
  total: number;
  status: BookingStatus;
  payment: PaymentStatus;
  createdAt: string;
  requests?: string;
}

export interface Guest {
  id: string;
  name: string;
  email: string;
  phone: string;
  language: string;
  memberSince: string;
}

/** The logged-in demo guest. Bookings made in the app belong to this guest. */
export const demoGuest: Guest = {
  id: "G-DEMO",
  name: "Demo Guest",
  email: "guest@example.com",
  phone: "9876543210",
  language: "English",
  memberSince: "2026",
};

export const guests: Guest[] = [
  demoGuest,
  { id: "G-101", name: "Priya Raman", email: "priya.r@example.com", phone: "9840012345", language: "Tamil", memberSince: "2024" },
  { id: "G-102", name: "Arjun Mehta", email: "arjun.m@example.com", phone: "9820098765", language: "Hindi", memberSince: "2025" },
  { id: "G-103", name: "Sneha Reddy", email: "sneha.r@example.com", phone: "9000011122", language: "Telugu", memberSince: "2023" },
  { id: "G-104", name: "Rahul Nair", email: "rahul.n@example.com", phone: "9446012233", language: "Malayalam", memberSince: "2026" },
  { id: "G-105", name: "Ananya Das", email: "ananya.d@example.com", phone: "9830054321", language: "Bengali", memberSince: "2025" },
];

export function isoDay(offset = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function nightsBetween(a: string, b: string): number {
  const ms = new Date(b + "T00:00:00").getTime() - new Date(a + "T00:00:00").getTime();
  return Math.round(ms / 86400000);
}

export function getRoom(id: string): Room | undefined {
  return rooms.find((r) => r.id === id);
}

function mk(id: string, g: Guest, roomId: string, inOff: number, outOff: number, guestsN: number, status: BookingStatus, payment: PaymentStatus): Booking {
  const checkIn = isoDay(inOff);
  const checkOut = isoDay(outOff);
  const nights = nightsBetween(checkIn, checkOut);
  return {
    id, guestId: g.id, guestName: g.name, email: g.email, phone: g.phone, roomId, checkIn, checkOut,
    guests: guestsN, nights, total: nights * (getRoom(roomId)?.price ?? 0), status, payment, createdAt: isoDay(-10),
  };
}

export function seedBookings(): Booking[] {
  const [, priya, arjun, sneha, rahul, ananya] = guests;
  return [
    mk("AR-1001", priya, "infinity-pool-villa", 0, 3, 2, "Confirmed", "Paid"),
    mk("AR-1002", arjun, "family-suite", 0, 2, 4, "Confirmed", "Payment Pending"),
    mk("AR-1003", sneha, "deluxe-valley", -3, 0, 2, "Checked In", "Paid"),
    mk("AR-1004", rahul, "forest-treehouse", -2, 0, 1, "Checked In", "Paid"),
    mk("AR-1005", ananya, "deluxe-valley", 2, 5, 2, "Pending", "Payment Pending"),
  ];
}

// Operations
export type RoomReadiness = "Ready" | "Cleaning" | "Inspection" | "Out of Service";
export interface RoomUnit { number: string; roomId: string; readiness: RoomReadiness }
export const roomUnits: RoomUnit[] = [
  { number: "101", roomId: "deluxe-valley", readiness: "Ready" },
  { number: "102", roomId: "deluxe-valley", readiness: "Cleaning" },
  { number: "103", roomId: "deluxe-valley", readiness: "Ready" },
  { number: "201", roomId: "family-suite", readiness: "Inspection" },
  { number: "202", roomId: "family-suite", readiness: "Ready" },
  { number: "T1", roomId: "forest-treehouse", readiness: "Cleaning" },
  { number: "T2", roomId: "forest-treehouse", readiness: "Out of Service" },
  { number: "V1", roomId: "infinity-pool-villa", readiness: "Ready" },
  { number: "V2", roomId: "infinity-pool-villa", readiness: "Ready" },
];

export type TaskStatus = "Open" | "In Progress" | "Done";
export interface OpsTask {
  id: string;
  kind: "Housekeeping" | "Maintenance" | "Staff";
  title: string;
  location: string;
  assignee: string;
  priority: "Low" | "Medium" | "High";
  status: TaskStatus;
}
export const opsTasks: OpsTask[] = [
  { id: "HK-1", kind: "Housekeeping", title: "Departure clean", location: "Room 102", assignee: "Lakshmi", priority: "High", status: "In Progress" },
  { id: "HK-2", kind: "Housekeeping", title: "Turndown service", location: "Villa V1", assignee: "Meena", priority: "Medium", status: "Open" },
  { id: "HK-3", kind: "Housekeeping", title: "Linen restock", location: "Treehouse T1", assignee: "Ravi", priority: "Low", status: "Open" },
  { id: "MT-1", kind: "Maintenance", title: "Walkway lantern not working", location: "Treehouse T2", assignee: "Suresh", priority: "High", status: "Open" },
  { id: "MT-2", kind: "Maintenance", title: "Pool heater check", location: "Infinity Pool", assignee: "Kiran", priority: "Medium", status: "In Progress" },
  { id: "MT-3", kind: "Maintenance", title: "Fireplace flue inspection", location: "Suite 201", assignee: "Suresh", priority: "Low", status: "Done" },
  { id: "ST-1", kind: "Staff", title: "Sunrise trek guide briefing", location: "Trailhead", assignee: "Guide team", priority: "Medium", status: "Done" },
  { id: "ST-2", kind: "Staff", title: "Ember Terrace dinner setup", location: "Ember Terrace", assignee: "F&B team", priority: "Medium", status: "Open" },
];

export const opsAlerts = [
  { id: "AL-1", level: "High", message: "Treehouse T2 out of service — walkway lighting fault." },
  { id: "AL-2", level: "Medium", message: "Fog advisory for tomorrow's 4:30 AM Sunrise Ridge Trek." },
  { id: "AL-3", level: "Low", message: "Spa towel stock below 30%." },
];

export const formatINR = (n: number) => "₹" + n.toLocaleString("en-IN");

// ---------- Assistant translations ----------
export const languages = ["English", "Telugu", "Hindi", "Tamil", "Kannada", "Malayalam", "Bengali"] as const;
export type Language = (typeof languages)[number];

export const quickActionKeys = ["room", "plan", "activities", "facilities", "dining", "booking", "support"] as const;
export type QuickKey = (typeof quickActionKeys)[number];

type Strings = { greeting: string; placeholder: string; send: string; title: string; actions: Record<QuickKey, string> };
export const translations: Partial<Record<Language, Partial<Strings> & { actions?: Partial<Record<QuickKey, string>> }>> & { English: Strings } = {
  English: {
    greeting: "Hi! How can I help you?",
    placeholder: "Type your question…",
    send: "Send",
    title: "Guest Assistant",
    actions: { room: "Find a Room", plan: "Plan My Stay", activities: "Activities", facilities: "Resort Facilities", dining: "Dining", booking: "My Booking", support: "Guest Support" },
  },
  Hindi: {
    greeting: "नमस्ते! मैं आपकी कैसे मदद कर सकता हूँ?",
    placeholder: "अपना प्रश्न लिखें…",
    send: "भेजें",
    title: "अतिथि सहायक",
    actions: { room: "कमरा खोजें", plan: "मेरी यात्रा योजना", activities: "गतिविधियाँ", facilities: "रिज़ॉर्ट सुविधाएँ", dining: "भोजन", booking: "मेरी बुकिंग", support: "अतिथि सहायता" },
  },
  Telugu: {
    greeting: "నమస్కారం! నేను మీకు ఎలా సహాయం చేయగలను?",
    placeholder: "మీ ప్రశ్నను టైప్ చేయండి…",
    send: "పంపు",
    title: "అతిథి సహాయకుడు",
    actions: { room: "గది వెతకండి", plan: "నా బస ప్లాన్", activities: "కార్యకలాపాలు", facilities: "రిసార్ట్ సౌకర్యాలు", dining: "భోజనం", booking: "నా బుకింగ్", support: "అతిథి సహాయం" },
  },
  Tamil: {
    greeting: "வணக்கம்! நான் உங்களுக்கு எப்படி உதவலாம்?",
    placeholder: "உங்கள் கேள்வியை தட்டச்சு செய்யவும்…",
    send: "அனுப்பு",
    title: "விருந்தினர் உதவியாளர்",
    actions: { room: "அறையைத் தேடு", plan: "எனது தங்குதல் திட்டம்", activities: "செயல்பாடுகள்", facilities: "ரிசார்ட் வசதிகள்", dining: "உணவு", booking: "எனது முன்பதிவு", support: "விருந்தினர் உதவி" },
  },
  Kannada: {
    greeting: "ನಮಸ್ಕಾರ! ನಾನು ನಿಮಗೆ ಹೇಗೆ ಸಹಾಯ ಮಾಡಲಿ?",
    placeholder: "ನಿಮ್ಮ ಪ್ರಶ್ನೆಯನ್ನು ಟೈಪ್ ಮಾಡಿ…",
    send: "ಕಳುಹಿಸಿ",
    title: "ಅತಿಥಿ ಸಹಾಯಕ",
    actions: { room: "ಕೊಠಡಿ ಹುಡುಕಿ", plan: "ನನ್ನ ವಾಸ ಯೋಜನೆ", activities: "ಚಟುವಟಿಕೆಗಳು", facilities: "ರೆಸಾರ್ಟ್ ಸೌಲಭ್ಯಗಳು", dining: "ಊಟ", booking: "ನನ್ನ ಬುಕಿಂಗ್", support: "ಅತಿಥಿ ಸಹಾಯ" },
  },
  Malayalam: {
    greeting: "നമസ്കാരം! ഞാൻ നിങ്ങളെ എങ്ങനെ സഹായിക്കാം?",
    placeholder: "നിങ്ങളുടെ ചോദ്യം ടൈപ്പ് ചെയ്യുക…",
    send: "അയയ്ക്കുക",
    title: "അതിഥി സഹായി",
    actions: { room: "മുറി കണ്ടെത്തുക", plan: "എന്റെ താമസം പ്ലാൻ", activities: "പ്രവർത്തനങ്ങൾ", facilities: "റിസോർട്ട് സൗകര്യങ്ങൾ", dining: "ഭക്ഷണം", booking: "എന്റെ ബുക്കിംഗ്", support: "അതിഥി സഹായം" },
  },
  Bengali: {
    greeting: "নমস্কার! আমি কীভাবে আপনাকে সাহায্য করতে পারি?",
    placeholder: "আপনার প্রশ্ন লিখুন…",
    send: "পাঠান",
    title: "অতিথি সহায়ক",
    actions: { room: "রুম খুঁজুন", plan: "আমার ভ্রমণ পরিকল্পনা", activities: "কার্যকলাপ", facilities: "রিসর্ট সুবিধা", dining: "খাবার", booking: "আমার বুকিং", support: "অতিথি সহায়তা" },
  },
};

export function t(lang: Language) {
  const base = translations.English;
  const tr = translations[lang] ?? {};
  return {
    greeting: tr.greeting ?? base.greeting,
    placeholder: tr.placeholder ?? base.placeholder,
    send: tr.send ?? base.send,
    title: tr.title ?? base.title,
    actions: { ...base.actions, ...(tr.actions ?? {}) } as Record<QuickKey, string>,
  };
}

export { hero as heroImage };
