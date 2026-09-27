// Ranks the 10 destinations for the group, and explains how well each one fits each person.
//
// Each person gets a fit score out of 100 for each place:
//   - Budget      up to 40 points: full marks if the rough cost is within their budget.
//   - Trip type   up to 40 points: full marks if the place is a kind of trip they picked.
//   - Season      up to 20 points: share of their free dates that fall in the place's good months.
// A place someone said they won't go to scores 0 for them and counts as a veto.
//
// The group score is 70% the average fit plus 30% the lowest single fit, so an option that
// leaves one person unhappy ranks below one that works reasonably for everyone.
// Places nobody has vetoed always rank above places somebody has.

import {
  DESTINATIONS,
  Destination,
  MONTH_NAMES,
  formatRupees,
  tripTypeLabel,
} from "./data";

export type TripResponse = {
  name: string;
  budget: number;
  available_from: string; // YYYY-MM-DD
  available_to: string; // YYYY-MM-DD
  trip_types: string[];
  no_go: string[];
  updated_at?: string;
};

export type PersonFit = {
  name: string;
  score: number;
  verdict: "Great fit" | "Okay" | "Poor fit" | "Won't go";
  vetoed: boolean;
  withinBudget: boolean;
  typeMatch: boolean;
  inSeason: boolean;
  reasons: string[];
};

export type RankedOption = {
  destination: Destination;
  groupScore: number;
  averageScore: number;
  lowestScore: number;
  vetoedBy: string[];
  people: PersonFit[];
};

const MAX_DAYS = 366;

function parseDate(value: string): Date {
  const [y, m, d] = value.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

function formatDate(date: Date): string {
  return `${date.getUTCDate()} ${MONTH_NAMES[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
}

/** Share (0–1) of the days from `from` to `to` that fall in one of `months`. */
function seasonShare(from: string, to: string, months: number[]): number {
  const start = parseDate(from);
  const end = parseDate(to);
  let total = 0;
  let good = 0;
  for (let day = new Date(start); day <= end && total < MAX_DAYS; day.setUTCDate(day.getUTCDate() + 1)) {
    total++;
    if (months.includes(day.getUTCMonth() + 1)) good++;
  }
  return total === 0 ? 0 : good / total;
}

function verdictFor(score: number): PersonFit["verdict"] {
  if (score >= 75) return "Great fit";
  if (score >= 50) return "Okay";
  return "Poor fit";
}

export function scorePerson(response: TripResponse, dest: Destination): PersonFit {
  if (response.no_go.includes(dest.id)) {
    return {
      name: response.name,
      score: 0,
      verdict: "Won't go",
      vetoed: true,
      withinBudget: false,
      typeMatch: false,
      inSeason: false,
      reasons: [`Said they won't go to ${dest.name}`],
    };
  }

  const reasons: string[] = [];

  // Budget
  let budgetPoints: number;
  const withinBudget = dest.costPerPerson <= response.budget;
  if (withinBudget) {
    budgetPoints = 40;
    reasons.push(
      `Within budget: about ${formatRupees(dest.costPerPerson)} vs their ${formatRupees(response.budget)}`,
    );
  } else {
    const over = (dest.costPerPerson - response.budget) / response.budget;
    budgetPoints = over <= 0.25 ? Math.round(10 + 30 * (1 - over / 0.25)) : 0;
    reasons.push(
      `Over budget by ${formatRupees(dest.costPerPerson - response.budget)} (about ${formatRupees(dest.costPerPerson)} vs their ${formatRupees(response.budget)})`,
    );
  }

  // Trip type
  let typePoints: number;
  const matches = dest.types.filter((t) => response.trip_types.includes(t));
  const typeMatch = matches.length > 0;
  if (response.trip_types.length === 0) {
    typePoints = 30;
    reasons.push("No trip-type preference, so any kind of trip works");
  } else if (typeMatch) {
    typePoints = 40;
    reasons.push(`Matches the kind of trip they want: ${matches.map(tripTypeLabel).join(", ")}`);
  } else {
    typePoints = 10;
    reasons.push(
      `Not the kind of trip they picked (they wanted ${response.trip_types.map(tripTypeLabel).join(", ")})`,
    );
  }

  // Season
  const share = seasonShare(response.available_from, response.available_to, dest.goodMonths);
  const seasonPoints = Math.round(20 * share);
  const inSeason = share >= 0.5;
  if (share === 1) reasons.push("All of their free dates are in good season");
  else if (share === 0) reasons.push(`Their free dates are off-season (${dest.seasonNote})`);
  else reasons.push(`${Math.round(share * 100)}% of their free dates are in good season`);

  const score = budgetPoints + typePoints + seasonPoints;
  return {
    name: response.name,
    score,
    verdict: verdictFor(score),
    vetoed: false,
    withinBudget,
    typeMatch: typeMatch || response.trip_types.length === 0,
    inSeason,
    reasons,
  };
}

export function rankDestinations(responses: TripResponse[]): RankedOption[] {
  const options = DESTINATIONS.map((destination) => {
    const people = responses.map((r) => scorePerson(r, destination));
    const scores = people.map((p) => p.score);
    const averageScore = scores.reduce((a, b) => a + b, 0) / Math.max(scores.length, 1);
    const lowestScore = scores.length ? Math.min(...scores) : 0;
    return {
      destination,
      groupScore: Math.round(0.7 * averageScore + 0.3 * lowestScore),
      averageScore: Math.round(averageScore),
      lowestScore,
      vetoedBy: people.filter((p) => p.vetoed).map((p) => p.name),
      people,
    };
  });

  return options.sort(
    (a, b) =>
      Number(a.vetoedBy.length > 0) - Number(b.vetoedBy.length > 0) ||
      b.groupScore - a.groupScore ||
      a.destination.costPerPerson - b.destination.costPerPerson,
  );
}

/** The dates when everyone is free, or null if there is no such window. */
export function commonWindow(responses: TripResponse[]): { from: string; to: string; days: number } | null {
  if (responses.length === 0) return null;
  const from = new Date(Math.max(...responses.map((r) => parseDate(r.available_from).getTime())));
  const to = new Date(Math.min(...responses.map((r) => parseDate(r.available_to).getTime())));
  if (from > to) return null;
  const days = Math.round((to.getTime() - from.getTime()) / 86_400_000) + 1;
  return { from: formatDate(from), to: formatDate(to), days };
}

export function formatRange(from: string, to: string): string {
  return `${formatDate(parseDate(from))} – ${formatDate(parseDate(to))}`;
}
