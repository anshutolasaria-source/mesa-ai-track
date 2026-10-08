"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { DESTINATIONS, FRIENDS, TRIP_TYPES } from "@/lib/data";
import { getSupabase } from "@/lib/supabase";

type Status =
  | { kind: "idle" }
  | { kind: "saving" }
  | { kind: "saved"; name: string }
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
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  // The form always starts blank: earlier answers are never loaded back in.
  function chooseName(value: string) {
    setName(value);
    setForm(EMPTY);
    setStatus({ kind: "idle" });
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
      // Clear the form so the next person starts fresh.
      setName("");
      setForm(EMPTY);
      setStatus({ kind: "saved", name });
    } catch (err) {
      setStatus({ kind: "error", message: errorMessage(err) });
    }
  }

  const busy = status.kind === "saving";

  return (
    <main>
      <h1>Where should we go?</h1>
      <p className="lead">
        Pick your name and fill in your preferences. If you change your mind, just fill it in
        again: your new answer replaces your old one.
      </p>

      <form onSubmit={submit} className="card" autoComplete="off">
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
            {status.kind === "saving" ? "Saving…" : "Submit my answer"}
          </button>
        </fieldset>

        {status.kind === "saved" && (
          <p className="success">
            Thanks {status.name}, your answer is saved.{" "}
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
