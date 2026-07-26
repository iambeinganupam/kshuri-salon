'use client';
// ─────────────────────────────────────────────────────────────────────────────
// CertificationsEditor — Repeater list used inside the vendor Edit-tab
// "Social & Credibility" section, matching the salon dashboard's visual.
//
// In edit mode each row is a (name | issuer | year | remove) grid. In view
// mode rows render as a small shield-iconed list with `name · issuer · year`.
// The 20-entry cap mirrors the salon page's hard limit.
// ─────────────────────────────────────────────────────────────────────────────

import { Plus, Shield, Trash2 } from 'lucide-react';
import { Button } from '../../button';
import { Input } from '../../input';

export interface CertificationItem {
  name: string;
  issuer: string;
  year: number;
  /** Optional — surfaced in view mode if present. */
  credential_id?: string | null;
}

interface Props {
  isEditing: boolean;
  /** Persisted list shown in view mode. */
  view: CertificationItem[];
  /** Working draft list shown in edit mode. */
  draft: CertificationItem[];
  onChange: (next: CertificationItem[]) => void;
  maxItems?: number;
}

const DEFAULT_MAX = 20;

export function CertificationsEditor({
  isEditing,
  view,
  draft,
  onChange,
  maxItems = DEFAULT_MAX,
}: Props) {
  const items = isEditing ? draft : view;

  const update = (idx: number, patch: Partial<CertificationItem>) =>
    onChange(draft.map((it, i) => (i === idx ? { ...it, ...patch } : it)));

  const remove = (idx: number) => onChange(draft.filter((_, i) => i !== idx));

  const add = () =>
    onChange([
      ...draft,
      { name: '', issuer: '', year: new Date().getFullYear() },
    ]);

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-xs font-semibold flex items-center gap-1.5">
          <Shield className="h-3.5 w-3.5 text-primary" /> Certifications & Training
        </h4>
        {isEditing && draft.length < maxItems && (
          <Button
            variant="outline"
            size="sm"
            type="button"
            className="h-7 gap-1 text-[11px] rounded-lg"
            onClick={add}
          >
            <Plus className="h-3 w-3" /> Add
          </Button>
        )}
      </div>

      {items.length === 0 && (
        <p className="text-xs text-muted-foreground italic">
          {isEditing
            ? 'Add a certification to build trust with customers.'
            : 'None added yet.'}
        </p>
      )}

      {isEditing
        ? draft.map((c, idx) => (
            <div
              key={idx}
              className="grid grid-cols-1 md:grid-cols-[1fr_1fr_90px_auto] gap-2 mb-2 items-start"
            >
              <Input
                value={c.name}
                onChange={(e) => update(idx, { name: e.target.value })}
                placeholder="Certification name"
                maxLength={150}
                className="h-9 rounded-lg text-xs"
              />
              <Input
                value={c.issuer}
                onChange={(e) => update(idx, { issuer: e.target.value })}
                placeholder="Issuer"
                maxLength={150}
                className="h-9 rounded-lg text-xs"
              />
              <Input
                value={String(c.year)}
                onChange={(e) =>
                  update(idx, { year: Number(e.target.value) || 0 })
                }
                placeholder="Year"
                inputMode="numeric"
                maxLength={4}
                className="h-9 rounded-lg text-xs"
              />
              <Button
                variant="ghost"
                size="icon"
                type="button"
                className="h-9 w-9 text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={() => remove(idx)}
                aria-label="Remove certification"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))
        : view.map((c, idx) => (
            <div
              key={idx}
              className="flex items-start gap-3 py-2 border-b border-border/30 last:border-0"
            >
              <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                <Shield className="h-3.5 w-3.5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{c.name}</p>
                <p className="text-xs text-muted-foreground">
                  {c.issuer} · {c.year}
                  {c.credential_id ? ` · ID ${c.credential_id}` : ''}
                </p>
              </div>
            </div>
          ))}
    </div>
  );
}

export default CertificationsEditor;
