"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { DESTINATIONS, FRIENDS, TRIP_TYPES } from "@/lib/data";
import { getSupabase } from "@/lib/supabase";
import type { TripResponse } from "@/lib/scoring";

type Status =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "saving" }
  | { kind: "saved"; edited: boolean }
  | { kind: "error"; message: string };

const EMPTY = {
  budget: "",
  from: "",
  to: "",
  tripTypes: [] as string[],
  noGo: [] as string[],
};

export default function PreferencesPage() {
  const [name, setName] = useState("");
  const [form, setForm] = useState(EMPTY);
  const [hasExisting, setHasExisting] = useState(false);
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  async function chooseName(value: string) {
    setName(value);
    setForm(EMPTY);
    setHasExisting(false);
    if (!value) return setStatus({ kind: "idle" });

    setStatus({ kind: "loading" });
    try {
      const { data, error } = await getSupabase()
        .from("responses")
        .select("*")
        .eq("name", value)
        .maybeSingle<TripResponse>();
      if (error) throw error;
      if (data) {
        setForm({
          budget: String(data.budget),
          from: data.available_from,
          to: data.available_to,
          tripTypes: data.trip_types,
          noGo: data.no_go,
        });
        setHasExisting(true);
      }
      setStatus({ kind: "idle" });
    } catch (err) {
      setStatus({ kind: "error", message: errorMessage(err) });
    }
  }

  function toggle(field: "tripTypes" | "noGo", id: string) {
    setForm((f) => ({
      ...f,
      [field]: f[field].includes(id) ? f[field].filter((x) => x !== id) : [...f[field], id],
    }));
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    const budget = Number(form.budget);
    if (!name) return setStatus({ kind: "error", message: "Pick your name first." });
    if (!Number.isFinite(budget) || budget <= 0)
      return setStatus({ kind: "error", message: "Enter a budget greater than zero." });
    if (!form.from || !form.to)
      return setStatus({ kind: "error", message: "Enter both the start and end of when you're free." });
    if (form.to < form.from)
      return setStatus({ kind: "error", message: "The end date can't be before the start date." });
    if (form.noGo.length === DESTINATIONS.length)
      return setStatus({ kind: "error", message: "You've ruled out every place. Leave at least one open." });

    setStatus({ kind: "saving" });
    try {
      const { error } = await getSupabase()
        .from("responses")
        .upsert(
          {
            name,
            budget: Math.round(budget),
            available_from: form.from,
            available_to: form.to,
            trip_types: form.tripTypes,
            no_go: form.noGo,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "name" },
        );
      if (error) throw error;
      setStatus({ kind: "saved", edited: hasExisting });
      setHasExisting(true);
    } catch (err) {
      setStatus({ kind: "error", message: errorMessage(err) });
    }
  }

  const busy = status.kind === "loading" || status.kind === "saving";

  return (
    <main>
      <h1>Where should we go?</h1>
      <p className="lead">
        Add your preferences once. If you change your mind later, come back, pick your name, and
        update your answer.
      </p>

      <form onSubmit={submit} className="card">
        <label className="field">
          <span>Your name</span>
          <select value={name} onChange={(e) => chooseName(e.target.value)} required>
            <option value="">Choose your name…</option>
            {FRIENDS.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
        </label>

        {status.kind === "loading" && <p className="muted">Loading your answer…</p>}
        {hasExisting && status.kind === "idle" && (
          <p className="notice">We found your earlier answer. Change anything you like and save again.</p>
        )}

        <fieldset disabled={!name || busy}>
          <label className="field">
            <span>Budget per person for the whole trip (₹)</span>
            <input
              type="number"
              inputMode="numeric"
              min={1}
              placeholder="e.g. 15000"
              value={form.budget}
              onChange={(e) => setForm({ ...form, budget: e.target.value })}
              required
            />
            <small className="muted">Include travel, stay and food, for a trip of about 4 days.</small>
          </label>

          <div className="field">
            <span>When are you free?</span>
            <div className="row">
              <label className="inline">
                From
                <input
                  type="date"
                  value={form.from}
                  onChange={(e) => setForm({ ...form, from: e.target.value })}
                  required
                />
              </label>
              <label className="inline">
                To
                <input
                  type="date"
                  value={form.to}
                  min={form.from || undefined}
                  onChange={(e) => setForm({ ...form, to: e.target.value })}
                  required
                />
              </label>
            </div>
          </div>

          <div className="field">
            <span>What kind of trip do you want? (pick any)</span>
            <div className="chips">
              {TRIP_TYPES.map((t) => (
                <label key={t.id} className={`chip ${form.tripTypes.includes(t.id) ? "on" : ""}`}>
                  <input
                    type="checkbox"
                    checked={form.tripTypes.includes(t.id)}
                    onChange={() => toggle("tripTypes", t.id)}
                  />
                  {t.label}
                </label>
              ))}
            </div>
          </div>

          <div className="field">
            <span>Places you won't go (pick any)</span>
            <div className="chips">
              {DESTINATIONS.map((d) => (
                <label key={d.id} className={`chip no ${form.noGo.includes(d.id) ? "on" : ""}`}>
                  <input
                    type="checkbox"
                    checked={form.noGo.includes(d.id)}
                    onChange={() => toggle("noGo", d.id)}
                  />
                  {d.name}
                </label>
              ))}
            </div>
          </div>

          <button type="submit">
            {status.kind === "saving" ? "Saving…" : hasExisting ? "Update my answer" : "Submit my answer"}
          </button>
        </fieldset>

        {status.kind === "saved" && (
          <p className="success">
            {status.edited ? "Your answer is updated." : "Thanks, your answer is saved."}{" "}
            <Link href="/results">See the results →</Link>
          </p>
        )}
        {status.kind === "error" && <p className="error">{status.message}</p>}
      </form>
    </main>
  );
}

function errorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (err && typeof err === "object" && "message" in err) return String(err.message);
  return "Something went wrong. Please try again.";
}
