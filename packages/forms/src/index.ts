// ─────────────────────────────────────────────────────────────────────────────
// @kshuri/forms — react-hook-form + Zod + @kshuri/ui FormField wrappers
//
// Public surface:
//   - useZodForm: typed useForm that wires a Zod schema as resolver
//   - Form:       FormProvider + <form> element wired to handleSubmit
//   - <TextField>, <TextareaField>, <SelectField>, <CheckboxField>:
//       react-hook-form-bound, label + error + description in one prop set
//   - <SubmitButton>: disables on submit, shows a spinner
// ─────────────────────────────────────────────────────────────────────────────

export { Form } from "./form";
export type { FormProps } from "./form";

export { useZodForm } from "./use-zod-form";
export type { UseZodFormOptions, ZodFormReturn } from "./use-zod-form";

export * from "./fields";

// Re-export the runtime that consumers will want from react-hook-form,
// so they only need to install @kshuri/forms.
export { Controller, useFormContext, useFormState, useWatch } from "react-hook-form";
export type {
  Control,
  ControllerRenderProps,
  FieldError,
  FieldErrors,
  FieldPath,
  FieldValues,
  SubmitHandler,
  UseFormReturn,
} from "react-hook-form";
