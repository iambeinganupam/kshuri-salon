'use client';
// ─────────────────────────────────────────────────────────────────────────────
// SocialLinksEditor — Website / Instagram / YouTube grid for vendor Edit pages.
//
// Three uniform fields with the same uppercase, tracking-wider labels and
// `h-10 rounded-xl` inputs used in the salon Profile-Edit "Social &
// Credibility" section. In view-mode the URLs render as clickable links.
// Validation is delegated to the parent so each consumer can plug its own
// validator (most use `validateUrl` from app utils).
// ─────────────────────────────────────────────────────────────────────────────

import { Globe, Instagram, Youtube } from 'lucide-react';
import { Input } from '../../input';
import { cn } from '../../../lib/utils';

export interface SocialLinksValue {
  website?: string;
  instagram?: string;
  youtube?: string;
}

export interface SocialLinksErrors {
  website?: string | null;
  instagram?: string | null;
  youtube?: string | null;
}

interface Props {
  isEditing: boolean;
  /** Persisted values (view mode). */
  view: SocialLinksValue;
  /** Working draft (edit mode). */
  draft: SocialLinksValue;
  errors?: SocialLinksErrors;
  onChange: (next: SocialLinksValue) => void;
  /** Called on blur for any field — lets parents run validators lazily. */
  onBlurField?: (field: keyof SocialLinksValue, value: string) => void;
}

const FIELDS = [
  { key: 'website',   label: 'Website',   icon: Globe,     placeholder: 'https://yourbrand.com' },
  { key: 'instagram', label: 'Instagram', icon: Instagram, placeholder: 'https://instagram.com/yourhandle' },
  { key: 'youtube',   label: 'YouTube',   icon: Youtube,   placeholder: 'https://youtube.com/@yourchannel' },
] as const;

export function SocialLinksEditor({
  isEditing,
  view,
  draft,
  errors,
  onChange,
  onBlurField,
}: Props) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {FIELDS.map(({ key, label, icon: Icon, placeholder }) => {
        const draftVal = draft[key] ?? '';
        const viewVal = view[key] ?? '';
        const error = errors?.[key];
        return (
          <div key={key} className="space-y-1.5">
            <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Icon className="h-3 w-3" /> {label}
            </label>
            {isEditing ? (
              <>
                <Input
                  value={draftVal}
                  onChange={(e) => onChange({ ...draft, [key]: e.target.value })}
                  onBlur={(e) => onBlurField?.(key, e.target.value)}
                  className={cn(
                    'h-10 rounded-xl text-xs',
                    error && 'border-destructive focus-visible:ring-destructive',
                  )}
                  placeholder={placeholder}
                  inputMode="url"
                />
                {error && <p className="text-[11px] text-destructive">{error}</p>}
              </>
            ) : (
              <p className="text-sm py-2 truncate">
                {viewVal ? (
                  <a
                    href={viewVal}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    {viewVal}
                  </a>
                ) : (
                  '—'
                )}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default SocialLinksEditor;
