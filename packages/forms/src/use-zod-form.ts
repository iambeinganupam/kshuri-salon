import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, type DefaultValues, type UseFormProps, type UseFormReturn } from "react-hook-form";
import type { z } from "zod";

export type ZodFormReturn<TSchema extends z.ZodTypeAny> = UseFormReturn<z.input<TSchema>>;

export interface UseZodFormOptions<TSchema extends z.ZodTypeAny>
  extends Omit<UseFormProps<z.input<TSchema>>, "resolver" | "defaultValues"> {
  schema: TSchema;
  defaultValues?: DefaultValues<z.input<TSchema>>;
}

/**
 * Wrap react-hook-form with a Zod schema. Inputs and outputs are typed against
 * the schema; the resolver handles parse-and-validate on submit and on the
 * form's configured `mode`.
 */
export function useZodForm<TSchema extends z.ZodTypeAny>({
  schema,
  defaultValues,
  ...formOptions
}: UseZodFormOptions<TSchema>): ZodFormReturn<TSchema> {
  return useForm<z.input<TSchema>>({
    resolver: zodResolver(schema),
    defaultValues,
    ...formOptions,
  });
}
