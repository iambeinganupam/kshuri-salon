'use client';
// ─────────────────────────────────────────────────────────────────────────────
// WorkingHoursEditor — shared by salon + freelancer Portfolio Edit pages.
//
// Self-contained: pulls from useWorkingHours, mutates via useUpdateWorkingHours.
// Renders one row per day (Mon → Sun, matching the salon SettingsPage convention),
// each with an Open/Closed switch and two time inputs that collapse to "Closed"
// when the toggle is off. A "Copy to all" helper lets vendors paste the same
// window across every day in one click — the single most common shape for
// solo freelancers and small salons.
//
// The wire shape (day_of_week 0-Sun … 6-Sat, HH:mm strings) is already what
// PUT /availability/working-hours expects, so we just round-trip it.
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useMemo, useState } from 'react';
import { Clock, Copy, Loader2, Save } from 'lucide-react';
import {
  useWorkingHours,
  useUpdateWorkingHours,
  type WorkingHoursEntry,
} from '@kshuri/api-client';
import { Button } from '../button';
import { Input } from '../input';
import { Switch } from '../switch';
import { Separator } from '../separator';

// Mon-first display order to match Indian retail convention.
const DAYS: ReadonlyArray<{ label: string; jsDay: number }> = [
  { label: 'Monday',    jsDay: 1 },
  { label: 'Tuesday',   jsDay: 2 },
  { label: 'Wednesday', jsDay: 3 },
  { label: 'Thursday',  jsDay: 4 },
  { label: 'Friday',    jsDay: 5 },
  { label: 'Saturday',  jsDay: 6 },
  { label: 'Sunday',    jsDay: 0 },
];

interface DayState {
  isOpen: boolean;
  open: string;   // "09:00"
  close: string;  // "20:00"
}

const DEFAULTS: DayState = { isOpen: true, open: '09:00', close: '20:00' };

interface Props {
  /** Toast hook (apps wire their own) — `null` skips toasts. */
  onSaved?: (message: string) => void;
  onError?: (message: string) => void;
  /**
   * Tighten the card to match the rest of the Portfolio edit page's
   * style. Apps already wrap us in a <Card>, so we render the body only.
   */
  bare?: boolean;
}

export function WorkingHoursEditor({ onSaved, onError, bare = false }: Props) {
  const { data: serverHours = [], isLoading } = useWorkingHours();
  const update = useUpdateWorkingHours();

  // Local edit state — keyed by display order (Mon-first).
  const [rows, setRows] = useState<DayState[]>(() =>
    DAYS.map(() => ({ ...DEFAULTS })),
  );
  const [dirty, setDirty] = useState(false);

  // Hydrate from server once.
  useEffect(() => {
    if (!serverHours || !Array.isArray(serverHours)) return;
    const mapped = DAYS.map(({ jsDay }) => {
      const row = (serverHours as WorkingHoursEntry[]).find((h) => h.day_of_week === jsDay);
      if (!row) return { ...DEFAULTS, isOpen: false };
      return {
        isOpen: !row.is_closed,
        open: row.open_time?.slice(0, 5) ?? '09:00',
        close: row.close_time?.slice(0, 5) ?? '20:00',
      };
    });
    setRows(mapped);
    setDirty(false);
  }, [serverHours]);

  const setRow = (idx: number, patch: Partial<DayState>) => {
    setRows((prev) => prev.map((r, i) => (i === idx ? { ...r, ...patch } : r)));
    setDirty(true);
  };

  /** Copy Monday's window to every other day that's also open. */
  function copyMondayToAll() {
    const mon = rows[0];
    setRows((prev) =>
      prev.map((r, i) =>
        i === 0
          ? r
          : { isOpen: mon.isOpen, open: mon.open, close: mon.close },
      ),
    );
    setDirty(true);
  }

  const hasInvalidRange = useMemo(
    () => rows.some((r) => r.isOpen && r.open >= r.close),
    [rows],
  );

  async function handleSave() {
    if (hasInvalidRange) {
      onError?.('Each open day needs a close time later than its open time.');
      return;
    }
    const payload: WorkingHoursEntry[] = rows.map((r, idx) => ({
      day_of_week: DAYS[idx].jsDay,
      is_closed: !r.isOpen,
      open_time: r.isOpen ? r.open : '00:00',
      close_time: r.isOpen ? r.close : '00:00',
    }));
    try {
      await update.mutateAsync(payload);
      setDirty(false);
      onSaved?.('Working hours saved');
    } catch {
      onError?.('Failed to save working hours');
    }
  }

  const body = (
    <>
      <div className="space-y-1">
        {rows.map((row, idx) => {
          const invalid = row.isOpen && row.open >= row.close;
          return (
            <div
              key={DAYS[idx].label}
              className={`flex flex-wrap items-center gap-3 rounded-xl px-3 py-2.5 transition-colors ${
                row.isOpen ? 'bg-muted/20 hover:bg-muted/30' : 'opacity-70'
              }`}
            >
              <div className="w-24 shrink-0">
                <p className={`text-[13px] font-medium ${row.isOpen ? 'text-foreground' : 'text-muted-foreground'}`}>
                  {DAYS[idx].label}
                </p>
              </div>

              <Switch
                checked={row.isOpen}
                onCheckedChange={(v) => setRow(idx, { isOpen: v })}
                aria-label={`Toggle ${DAYS[idx].label}`}
              />

              {row.isOpen ? (
                <div className="flex flex-1 flex-wrap items-center gap-2 min-w-0">
                  <Input
                    type="time"
                    value={row.open}
                    onChange={(e) => setRow(idx, { open: e.target.value })}
                    className={`h-9 w-28 rounded-lg text-center text-xs ${invalid ? 'border-destructive' : ''}`}
                  />
                  <span className="text-xs text-muted-foreground">to</span>
                  <Input
                    type="time"
                    value={row.close}
                    onChange={(e) => setRow(idx, { close: e.target.value })}
                    className={`h-9 w-28 rounded-lg text-center text-xs ${invalid ? 'border-destructive' : ''}`}
                  />
                  {invalid && (
                    <span className="ml-1 text-[11px] text-destructive">
                      Close must be later than open
                    </span>
                  )}
                </div>
              ) : (
                <span className="text-xs italic text-muted-foreground">Closed</span>
              )}
            </div>
          );
        })}
      </div>

      <Separator className="my-3 bg-border/40" />

      <div className="flex flex-wrap items-center justify-between gap-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="h-9 gap-1.5 rounded-lg text-xs"
          onClick={copyMondayToAll}
          disabled={!rows[0].isOpen}
        >
          <Copy className="h-3.5 w-3.5" /> Copy Monday to all days
        </Button>

        <Button
          type="button"
          size="sm"
          className="h-9 gap-1.5 rounded-lg"
          onClick={handleSave}
          disabled={!dirty || update.isPending || hasInvalidRange}
        >
          {update.isPending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Save className="h-3.5 w-3.5" />
          )}
          {update.isPending ? 'Saving…' : 'Save schedule'}
        </Button>
      </div>
    </>
  );

  if (bare) return body;

  return (
    <div className="rounded-2xl border border-border/40 bg-card p-5 md:p-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-primary/10 text-primary">
            <Clock className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-foreground">Opening hours</h3>
            <p className="text-xs text-muted-foreground">
              Customers only see slots within these windows.
            </p>
          </div>
        </div>
      </div>
      {isLoading ? (
        <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading schedule…
        </div>
      ) : (
        body
      )}
    </div>
  );
}
