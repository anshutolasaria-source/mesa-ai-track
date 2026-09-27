// Fixed data for the trip planner: the group, the trip types and the 10 places we choose from.

export const FRIENDS = ["Riya", "Siddharth", "Karan", "Aisha", "Preethi"] as const;
export type Friend = (typeof FRIENDS)[number];

export const TRIP_TYPES = [
  { id: "beach", label: "Beach" },
  { id: "mountains", label: "Mountains" },
  { id: "city", label: "City" },
  { id: "heritage", label: "Heritage & culture" },
  { id: "adventure", label: "Adventure" },
  { id: "nature", label: "Nature & wildlife" },
] as const;
export type TripType = (typeof TRIP_TYPES)[number]["id"];

export type Destination = {
  id: string;
  name: string;
  state: string;
  types: TripType[];
  // Rough cost per person for a 4-day trip (travel, stay, food), in rupees.
  costPerPerson: number;
  // Months with good weather, 1 = January.
  goodMonths: number[];
  seasonNote: string;
  blurb: string;
};

export const DESTINATIONS: Destination[] = [
  {
    id: "goa",
    name: "Goa",
    state: "Goa",
    types: ["beach", "city", "adventure"],
    costPerPerson: 18000,
    goodMonths: [10, 11, 12, 1, 2, 3],
    seasonNote: "Best Oct–Mar; heavy rain Jun–Sep",
    blurb: "Beaches, nightlife, water sports and Portuguese-era old towns.",
  },
  {
    id: "manali",
    name: "Manali",
    state: "Himachal Pradesh",
    types: ["mountains", "adventure", "nature"],
    costPerPerson: 16000,
    goodMonths: [3, 4, 5, 6, 10, 11],
    seasonNote: "Best Mar–Jun and Oct–Nov; landslide risk in monsoon",
    blurb: "Snow views, treks, paragliding and cafés in Old Manali.",
  },
  {
    id: "jaipur",
    name: "Jaipur",
    state: "Rajasthan",
    types: ["heritage", "city"],
    costPerPerson: 12000,
    goodMonths: [10, 11, 12, 1, 2, 3],
    seasonNote: "Best Oct–Mar; very hot Apr–Jun",
    blurb: "Forts, palaces, bazaars and Rajasthani food.",
  },
  {
    id: "rishikesh",
    name: "Rishikesh",
    state: "Uttarakhand",
    types: ["adventure", "mountains", "nature"],
    costPerPerson: 10000,
    goodMonths: [2, 3, 4, 5, 9, 10, 11],
    seasonNote: "Best Feb–May and Sep–Nov; rafting closed in monsoon",
    blurb: "River rafting, camping, yoga and the Ganga aarti.",
  },
  {
    id: "pondicherry",
    name: "Pondicherry",
    state: "Puducherry",
    types: ["beach", "heritage", "city"],
    costPerPerson: 12000,
    goodMonths: [10, 11, 12, 1, 2, 3],
    seasonNote: "Best Oct–Mar; humid in summer",
    blurb: "French Quarter streets, calm beaches and Auroville.",
  },
  {
    id: "udaipur",
    name: "Udaipur",
    state: "Rajasthan",
    types: ["heritage", "city"],
    costPerPerson: 15000,
    goodMonths: [9, 10, 11, 12, 1, 2, 3],
    seasonNote: "Best Sep–Mar; hot Apr–Jun",
    blurb: "Lakes, palaces, rooftop dinners and sunset boat rides.",
  },
  {
    id: "munnar",
    name: "Munnar",
    state: "Kerala",
    types: ["nature", "mountains"],
    costPerPerson: 14000,
    goodMonths: [9, 10, 11, 12, 1, 2, 3, 4, 5],
    seasonNote: "Best Sep–May; heavy monsoon Jun–Aug",
    blurb: "Tea gardens, misty hills, waterfalls and easy treks.",
  },
  {
    id: "andaman",
    name: "Andaman Islands",
    state: "Andaman & Nicobar",
    types: ["beach", "adventure", "nature"],
    costPerPerson: 35000,
    goodMonths: [11, 12, 1, 2, 3, 4, 5],
    seasonNote: "Best Nov–May; rough seas in monsoon",
    blurb: "Clear water, scuba diving, snorkelling and island hopping.",
  },
  {
    id: "darjeeling",
    name: "Darjeeling",
    state: "West Bengal",
    types: ["mountains", "nature", "heritage"],
    costPerPerson: 16000,
    goodMonths: [3, 4, 5, 10, 11],
    seasonNote: "Best Mar–May and Oct–Nov; cloudy in monsoon",
    blurb: "Kanchenjunga views, toy train, tea estates and monasteries.",
  },
  {
    id: "mumbai",
    name: "Mumbai",
    state: "Maharashtra",
    types: ["city", "beach"],
    costPerPerson: 18000,
    goodMonths: [11, 12, 1, 2],
    seasonNote: "Best Nov–Feb; very heavy rain Jun–Sep",
    blurb: "Street food, nightlife, sea-facing promenades and markets.",
  },
];

export const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

export function tripTypeLabel(id: string): string {
  return TRIP_TYPES.find((t) => t.id === id)?.label ?? id;
}

export function destinationName(id: string): string {
  return DESTINATIONS.find((d) => d.id === id)?.name ?? id;
}

export function formatRupees(amount: number): string {
  return "₹" + amount.toLocaleString("en-IN");
}
