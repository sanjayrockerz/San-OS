import { z } from "zod";

/** Credentials for email/password sign-in. */
export const signInSchema = z.object({
  email: z.email(),
  password: z.string().min(6, "Password must be at least 6 characters"),
});
export type SignInInput = z.infer<typeof signInSchema>;

/** Sign-up adds an optional display name. */
export const signUpSchema = signInSchema.extend({
  displayName: z.string().min(1).max(80).optional(),
});
export type SignUpInput = z.infer<typeof signUpSchema>;
