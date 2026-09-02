import { z } from "zod";

export const emailSchema = z
  .string({ error: "El correo es obligatorio." })
  .trim()
  .toLowerCase()
  .email("Ingresa un correo válido.");

export const passwordSchema = z
  .string({ error: "La contraseña es obligatoria." })
  .min(8, "La contraseña debe tener al menos 8 caracteres.")
  .max(72, "La contraseña no debe exceder 72 caracteres.");

export const loginSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

export const registerSchema = z
  .object({
    alias: z
      .string({ error: "El alias es obligatorio." })
      .trim()
      .min(2, "El alias debe tener al menos 2 caracteres.")
      .max(60, "El alias no debe exceder 60 caracteres."),
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: passwordSchema,
    aceptaTerminos: z
      .boolean()
      .refine((v) => v === true, "Debes aceptar los términos y el aviso de privacidad."),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden.",
    path: ["confirmPassword"],
  });

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
