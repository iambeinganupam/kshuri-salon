'use client';
// ─────────────────────────────────────────────────────────────────────────────
// AddressBook — list of saved addresses with delete / set-default mutations.
// Pulls data from useAddresses (React Query + ApiClientProvider context).
// ─────────────────────────────────────────────────────────────────────────────

import { Plus } from 'lucide-react';
import { Button } from '../components/button';
import { Skeleton } from '../components/skeleton';
import { AddressCard } from './AddressCard';
import {
  useAddresses,
  useDeleteAddress,
  useSetDefaultAddress,
} from '@kshuri/api-client';
import type { AddressDto } from '@kshuri/api-client';

interface Props {
  onEdit?: (address: AddressDto) => void;
  onAdd?: () => void;
}

export function AddressBook({ onEdit, onAdd }: Props) {
  const { data: addresses, isLoading, isError } = useAddresses();
  const deleteAddress = useDeleteAddress();
  const setDefaultAddress = useSetDefaultAddress();

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2].map((i) => (
          <Skeleton key={i} className="h-28 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <p className="text-sm text-destructive">
        Failed to load addresses. Please refresh.
      </p>
    );
  }

  const list = addresses ?? [];

  return (
    <div className="space-y-3">
      {list.map((address) => (
        <AddressCard
          key={address.id}
          address={address}
          onEdit={onEdit ? () => onEdit(address) : undefined}
          onSetDefault={() => setDefaultAddress.mutate(address.id)}
          onDelete={() => deleteAddress.mutate(address.id)}
        />
      ))}

      {list.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-6">
          No saved addresses yet.
        </p>
      )}

      {onAdd && (
        <Button
          variant="outline"
          className="w-full gap-2 border-dashed"
          onClick={onAdd}
        >
          <Plus className="h-4 w-4" /> Add address
        </Button>
      )}
    </div>
  );
}
