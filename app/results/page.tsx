"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { FRIENDS, formatRupees, tripTypeLabel } from "@/lib/data";
import { getSupabase } from "@/lib/supabase";
import {
  CLEARED_AT,
  RankedOption,
  TripResponse,
  commonWindow,
  formatRange,
  isCleared,
  rankDestinations,
} from "@/lib/scoring";

export default function ResultsPage() {
  const [responses, setResponses] = useState<TripResponse[] | null>(null);
  const [error, setError] = useState("");
  const [showAll, setShowAll] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const load = useCallback(async () => {
    setError("");
    try {
      const { data, error } = await getSupabase().from("responses").select("*");
      if (error) throw error;
      setResponses(((data ?? []) as TripResponse[]).filter((r) => !isCleared(r)));
    } catch (err) {
      setError(errorMessage(err));
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  /**
   * Clears every answer so the group (or a demo) can start from scratch.
   * The page asks for confirmation itself: a native confirm() dialog can be
   * suppressed by the browser, which silently cancelled the whole thing.
   */
  async function clearAll() {
    setClearing(true);
    setError("");
    try {
      const { data, error } = await getSupabase()
        .from("responses")
        .update({ updated_at: CLEARED_AT })
        .in("name", [...FRIENDS])
        .select();
      if (error) throw error;
      if (!data || data.length === 0) throw new Error("Nothing was cleared. Please try again.");
      await load();
      setShowAll(false);
      setConfirming(false);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setClearing(false);
    }
  }

  if (error && !responses) {
    return (
      <main>
        <h1>Results</h1>
        <p className="error">Couldn't load answers: {error}</p>
        <button onClick={load}>Try again</button>
      </main>
    );
  }
  if (!responses) {
    return (
      <main>
        <h1>Results</h1>
        <p className="muted">Loading…</p>
      </main>
    );
  }

  const byName = new Map(responses.map((r) => [r.name, r]));
  const ordered = FRIENDS.map((f) => byName.get(f)).filter((r): r is TripResponse => !!r);
  const waitingOn = FRIENDS.filter((f) => !byName.has(f));
  const everyoneIn = waitingOn.length === 0;

  const ranked = everyoneIn ? rankDestinations(ordered) : [];
  const top = ranked.slice(0, 3);
  const freeWindow = everyoneIn ? commonWindow(ordered) : null;

  return (
    <main>
      <h1>Results</h1>
      {error && <p className="error">{error}</p>}

      <section className="card">
        <div className="between">
          <h2>
            Who has answered ({ordered.length} of {FRIENDS.length})
          </h2>
          <div className="row">
            <button className="secondary" onClick={load}>
              Refresh
            </button>
            {ordered.length > 0 && !confirming && (
              <button className="secondary danger" onClick={() => setConfirming(true)}>
                Start over
              </button>
            )}
          </div>
        </div>
        {confirming && (
          <p className="notice confirm">
            <span>Clear everyone&apos;s answers and start over? This can&apos;t be undone.</span>
            <span className="row">
              <button className="danger-solid" onClick={clearAll} disabled={clearing}>
                {clearing ? "Clearing…" : "Yes, clear all answers"}
              </button>
              <button className="secondary" onClick={() => setConfirming(false)} disabled={clearing}>
                Cancel
              </button>
            </span>
          </p>
        )}
        <ul className="people">
          {FRIENDS.map((f) => {
            const r = byName.get(f);
            return (
              <li key={f} className={r ? "done" : "waiting"}>
                <strong>
                  {r ? "✓" : "…"} {f}
                </strong>
                {r ? (
                  <span className="muted">
                    {formatRupees(r.budget)} · {formatRange(r.available_from, r.available_to)} ·{" "}
                    {r.trip_types.length ? r.trip_types.map(tripTypeLabel).join(", ") : "any kind of trip"}
                  </span>
                ) : (
                  <span className="muted">Hasn't answered yet</span>
                )}
              </li>
            );
          })}
        </ul>
        {!everyoneIn && (
          <p className="notice">
            Waiting on {listNames(waitingOn)}. The top 3 options will appear here once everyone has
            answered. Share the <Link href="/">preferences form</Link> with them.
          </p>
        )}
      </section>

      {everyoneIn && (
        <>
          <section className="card">
            <h2>When everyone is free</h2>
            {freeWindow ? (
              <p>
                <strong>
                  {freeWindow.from} – {freeWindow.to}
                </strong>{" "}
                ({freeWindow.days} {freeWindow.days === 1 ? "day" : "days"} when all {FRIENDS.length} of you are free)
              </p>
            ) : (
              <p className="error">
                There are no dates when all {FRIENDS.length} of you are free. Someone will need to change
                their dates before you can book.
              </p>
            )}
          </section>

          <h2 className="section-title">Your top 3 options</h2>
          {top.map((option, i) => (
            <OptionCard key={option.destination.id} option={option} rank={i + 1} />
          ))}

          <p className="muted small">
            How we rank: each person gets a fit score out of 100 for each place (budget 40, trip type 40,
            weather during their dates 20). The group score is mostly the average, but it also counts
            the least happy person, so no one is left out. Places anyone ruled out come last. Costs are
            rough estimates per person for about 4 days, not live prices.
          </p>

          <button className="secondary" onClick={() => setShowAll((s) => !s)}>
            {showAll ? "Hide the other places" : "Show all 10 places"}
          </button>
          {showAll && (
            <table className="all">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Place</th>
                  <th>Group score</th>
                  <th>Lowest fit</th>
                  <th>Ruled out by</th>
                </tr>
              </thead>
              <tbody>
                {ranked.map((o, i) => (
                  <tr key={o.destination.id}>
                    <td>{i + 1}</td>
                    <td>{o.destination.name}</td>
                    <td>{o.groupScore}</td>
                    <td>{o.lowestScore}</td>
                    <td>{o.vetoedBy.length ? o.vetoedBy.join(", ") : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </>
      )}
    </main>
  );
}

function OptionCard({ option, rank }: { option: RankedOption; rank: number }) {
  const { destination: d, people } = option;
  const count = (fn: (p: (typeof people)[number]) => boolean) => people.filter(fn).length;
  const total = people.length;

  return (
    <section className="card option">
      <div className="between">
        <div>
          <p className="rank">Option {rank}</p>
          <h3>
            {d.name} <span className="muted">· {d.state}</span>
          </h3>
        </div>
        <div className="score" title="Group score out of 100">
          {option.groupScore}
          <small>/100</small>
        </div>
      </div>
      <p>{d.blurb}</p>
      <p className="muted">
        About {formatRupees(d.costPerPerson)} per person · {d.types.map(tripTypeLabel).join(", ")} ·{" "}
        {d.seasonNote}
      </p>

      <div className="chips">
        <span className="pill">
          {count((p) => p.withinBudget)} of {total} within budget
        </span>
        <span className="pill">
          {count((p) => p.typeMatch)} of {total} want this kind of trip
        </span>
        <span className="pill">
          {count((p) => p.inSeason)} of {total} free in good season
        </span>
        {option.vetoedBy.length > 0 && (
          <span className="pill bad">Ruled out by {option.vetoedBy.join(", ")}</span>
        )}
      </div>

      <table className="fit">
        <thead>
          <tr>
            <th>Person</th>
            <th>Fit</th>
            <th>Why</th>
          </tr>
        </thead>
        <tbody>
          {people.map((p) => (
            <tr key={p.name}>
              <td>
                <strong>{p.name}</strong>
              </td>
              <td>
                <span className={`verdict v-${p.verdict.replace(/[^a-z]/gi, "").toLowerCase()}`}>
                  {p.verdict}
                </span>
                <div className="bar" aria-hidden>
                  <div style={{ width: `${p.score}%` }} />
                </div>
                <small className="muted">{p.score}/100</small>
              </td>
              <td>
                <ul className="reasons">
                  {p.reasons.map((r) => (
                    <li key={r}>{r}</li>
                  ))}
                </ul>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

function errorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (err && typeof err === "object" && "message" in err) return String(err.message);
  return "Something went wrong. Please try again.";
}

function listNames(names: readonly string[]): string {
  if (names.length <= 1) return names.join("");
  return names.slice(0, -1).join(", ") + " and " + names[names.length - 1];
}
