import {
  useMutation,
  useQueryClient,
  type MutationFunction,
  type QueryKey,
  type UseMutationOptions,
  type UseMutationResult,
} from "@tanstack/react-query";

/**
 * Context returned by the internal onMutate handler; surfaced to onError so
 * the snapshot can be restored. Consumers can extend the shape via TContext
 * if they need to pass extra data through the cycle.
 */
export interface OptimisticContext<TData = unknown> {
  previous: TData | undefined;
}

export interface UseOptimisticMutationOptions<TData, TVariables, TError = unknown>
  extends Omit<
    UseMutationOptions<TData, TError, TVariables, OptimisticContext<TData>>,
    "onMutate" | "onError" | "onSettled" | "mutationFn"
  > {
  /** The actual network call. */
  mutationFn: MutationFunction<TData, TVariables>;
  /** The query whose cache reflects the mutation's effect. */
  queryKey: QueryKey;
  /**
   * Apply the optimistic change. Receives the current cached data (typed as
   * the same shape as the query result) and the mutation variables; returns
   * the new cache value. Pure, idempotent.
   */
  updater: (current: TData | undefined, variables: TVariables) => TData;
  /**
   * Whether to invalidate the queryKey on settle. Default: true. Set false
   * when the mutationFn's return value already replaces the cache.
   */
  invalidateOnSettle?: boolean;
  /**
   * Extra queryKeys to invalidate on settle (e.g. derived counts, parent
   * lists). Default: [].
   */
  alsoInvalidate?: readonly QueryKey[];
  /**
   * Called when the mutation errors AFTER the snapshot has been rolled back.
   * Use to surface a toast / error UI.
   */
  onErrorAfterRollback?: (error: TError, variables: TVariables) => void;
}

/**
 * Optimistic mutation helper. Wraps `useMutation` with the canonical
 * snapshot / set-cache / rollback / invalidate flow so consumers don't
 * have to remember it at each call site.
 *
 * Usage:
 *
 *   const toggle = useOptimisticMutation({
 *     mutationFn: (id: string) => api.wishlist.toggle(id),
 *     queryKey: ["wishlist"],
 *     updater: (list = [], id) =>
 *       list.includes(id) ? list.filter((x) => x !== id) : [...list, id],
 *     onErrorAfterRollback: (err) => toast.error(err.message),
 *   });
 *
 *   <Button onClick={() => toggle.mutate(vendorId)} />
 *
 * Lifecycle:
 *   1. `mutate(vars)` triggers `onMutate`.
 *   2. Cancel in-flight refetches for `queryKey`.
 *   3. Snapshot the current cache → context.previous.
 *   4. Apply `updater(current, vars)` to the cache (UI updates immediately).
 *   5. On success: cache stays.
 *   6. On error: restore context.previous; call `onErrorAfterRollback`.
 *   7. On settle (success OR error): invalidate `queryKey` (and
 *      `alsoInvalidate` keys) unless `invalidateOnSettle=false`.
 */
export function useOptimisticMutation<TData, TVariables, TError = unknown>({
  mutationFn,
  queryKey,
  updater,
  invalidateOnSettle = true,
  alsoInvalidate = [],
  onErrorAfterRollback,
  ...rest
}: UseOptimisticMutationOptions<TData, TVariables, TError>): UseMutationResult<
  TData,
  TError,
  TVariables,
  OptimisticContext<TData>
> {
  const queryClient = useQueryClient();

  return useMutation<TData, TError, TVariables, OptimisticContext<TData>>({
    ...rest,
    mutationFn,
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<TData>(queryKey);
      queryClient.setQueryData<TData>(queryKey, (current) =>
        updater(current, variables),
      );
      return { previous };
    },
    onError: (error, variables, context) => {
      if (context?.previous !== undefined) {
        queryClient.setQueryData<TData>(queryKey, context.previous);
      }
      onErrorAfterRollback?.(error, variables);
    },
    onSettled: () => {
      if (invalidateOnSettle) {
        queryClient.invalidateQueries({ queryKey });
      }
      for (const key of alsoInvalidate) {
        queryClient.invalidateQueries({ queryKey: key });
      }
    },
  });
}
