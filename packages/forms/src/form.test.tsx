import { describe, it, expect, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { z } from "zod";

import { Form } from "./form";
import { useZodForm } from "./use-zod-form";
import { TextField } from "./fields/text-field";
import { CheckboxField } from "./fields/checkbox-field";
import { SubmitButton } from "./fields/submit-button";

const signupSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "Min 8 chars"),
  terms: z.literal(true, {
    errorMap: () => ({ message: "You must accept the terms" }),
  }),
});

type SignupValues = z.input<typeof signupSchema>;

function SignupForm({ onValid }: { onValid: (v: SignupValues) => void }) {
  const form = useZodForm({
    schema: signupSchema,
    defaultValues: { email: "", password: "", terms: false as unknown as true },
    mode: "onSubmit",
  });
  return (
    <Form form={form} onSubmit={onValid}>
      <TextField name="email" label="Email" />
      <TextField name="password" label="Password" type="password" />
      <CheckboxField name="terms" label="I accept the terms" />
      <SubmitButton>Sign up</SubmitButton>
    </Form>
  );
}

describe("<Form> + Zod validation", () => {
  it("blocks submit and shows inline errors on invalid input", async () => {
    const onValid = vi.fn();
    render(<SignupForm onValid={onValid} />);

    fireEvent.click(screen.getByRole("button", { name: /sign up/i }));

    await waitFor(() => {
      expect(screen.getByText("Enter a valid email")).toBeInTheDocument();
    });
    expect(screen.getByText("Min 8 chars")).toBeInTheDocument();
    expect(screen.getByText("You must accept the terms")).toBeInTheDocument();
    expect(onValid).not.toHaveBeenCalled();
  });

  it("calls onSubmit with parsed values when valid", async () => {
    const user = userEvent.setup();
    const onValid = vi.fn();
    render(<SignupForm onValid={onValid} />);

    await user.type(screen.getByLabelText("Email"), "jane@example.com");
    await user.type(screen.getByLabelText("Password"), "correct-horse-battery");
    await user.click(screen.getByLabelText("I accept the terms"));
    await user.click(screen.getByRole("button", { name: /sign up/i }));

    await waitFor(() => {
      expect(onValid).toHaveBeenCalledTimes(1);
    });
    expect(onValid.mock.calls[0][0]).toEqual({
      email: "jane@example.com",
      password: "correct-horse-battery",
      terms: true,
    });
  });
});

describe("<SubmitButton>", () => {
  it("renders the children label by default", () => {
    function StaticForm() {
      const form = useZodForm({ schema: z.object({}), defaultValues: {} });
      return (
        <Form form={form} onSubmit={() => undefined}>
          <SubmitButton>Save changes</SubmitButton>
        </Form>
      );
    }
    render(<StaticForm />);
    expect(screen.getByRole("button", { name: "Save changes" })).toBeInTheDocument();
  });
});
