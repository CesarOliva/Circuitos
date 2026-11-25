"use client";

import { useState, type FormEvent } from "react";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Formulario listo para la base de datos: valida los campos, pero todavía no crea sesión.
export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const next: { email?: string; password?: string } = {};
    if (!EMAIL_PATTERN.test(email.trim())) next.email = "Escribe un correo válido, por ejemplo nombre@correo.com.";
    if (password.length < 8) next.password = "La contraseña debe tener al menos 8 caracteres.";
    setErrors(next);
    setSubmitted(Object.keys(next).length === 0);
  }

  return (
    <form className="auth" onSubmit={handleSubmit} noValidate>
      <h1>Iniciar sesión</h1>

      <div className="auth-field">
        <label htmlFor="login-email">Correo electrónico</label>
        <input
          id="login-email"
          name="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          aria-invalid={errors.email ? true : undefined}
          aria-describedby={errors.email ? "login-email-error" : undefined}
        />
        {errors.email && (
          <p id="login-email-error" className="auth-error">{errors.email}</p>
        )}
      </div>

      <div className="auth-field">
        <label htmlFor="login-password">Contraseña</label>
        <input
          id="login-password"
          name="password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          aria-invalid={errors.password ? true : undefined}
          aria-describedby={errors.password ? "login-password-error" : undefined}
        />
        {errors.password && (
          <p id="login-password-error" className="auth-error">{errors.password}</p>
        )}
      </div>

      <button type="submit" className="auth-submit">Entrar</button>

      {submitted && (
        <p className="auth-notice" role="status">
          Los datos son válidos. El inicio de sesión todavía no está conectado a la base de datos, así que aún no se crea
          ninguna sesión.
        </p>
      )}

      <p className="auth-foot">
        ¿No tienes cuenta? <span>Crear cuenta, próximamente.</span>
      </p>
    </form>
  );
}
