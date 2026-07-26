'use client';
// ─────────────────────────────────────────────────────────────────────────────
// AddressCard — display one saved address with Edit / Set Default / Delete /
// Directions actions.
// ─────────────────────────────────────────────────────────────────────────────

import { MapPin, Navigation, Pencil, Star, Trash2 } from 'lucide-react';
import { Badge } from '../components/badge';
import { Button } from '../components/button';
import { Card, CardContent } from '../components/card';
import { directionsUrl } from '@kshuri/api-client';
import type { AddressDto } from '@kshuri/api-client';

interface Props {
  address: AddressDto;
  onEdit?: () => void;
  onDelete?: () => void;
  onSetDefault?: () => void;
}

export function AddressCard({ address, onEdit, onDelete, onSetDefault }: Props) {
  const {
    label,
    is_default,
    address_line1,
    address_line2,
    city,
    state,
    postal_code,
    latitude,
    longitude,
  } = address;

  const hasCoords = latitude != null && longitude != null;

  return (
    <Card className="border-border/60">
      <CardContent className="p-4 space-y-3">
        {/* Header: label + default badge */}
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
          <span className="font-medium text-sm truncate">{label}</span>
          {is_default && (
            <Badge variant="secondary" className="ml-auto shrink-0 text-xs">
              Default
            </Badge>
          )}
        </div>

        {/* Address lines */}
        <p className="text-sm text-muted-foreground leading-relaxed">
          {address_line1}
          {address_line2 ? `, ${address_line2}` : ''}
          <br />
          {[city, state, postal_code].filter(Boolean).join(', ')}
        </p>

        {/* Action row */}
        <div className="flex items-center gap-2 flex-wrap">
          {onEdit && (
            <Button variant="outline" size="sm" className="gap-1.5 text-xs h-8" onClick={onEdit}>
              <Pencil className="h-3 w-3" /> Edit
            </Button>
          )}
          {!is_default && onSetDefault && (
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-xs h-8"
              onClick={onSetDefault}
            >
              <Star className="h-3 w-3" /> Set default
            </Button>
          )}
          {onDelete && (
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-xs h-8 text-destructive hover:text-destructive"
              onClick={onDelete}
            >
              <Trash2 className="h-3 w-3" /> Delete
            </Button>
          )}
          {hasCoords && (
            <a
              href={directionsUrl({ lat: latitude!, lng: longitude! })}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs h-8 px-3 rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              <Navigation className="h-3 w-3" /> Directions
            </a>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
