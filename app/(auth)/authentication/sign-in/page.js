"use client";

import { Button, Form } from "react-bootstrap";
import Link from "next/link";
import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { FaGithub, FaGoogle } from "react-icons/fa";
import AuthShell from "components/auth/AuthShell";
import styles from "components/auth/auth.module.scss";
import PasswordField from "components/auth/PasswordField";
import { httpRequest } from "lib/httpClient";
import { normalizeAuthRedirect } from "lib/authRedirect";

const signInFields = [
  {
    id: "email",
    label: "Email address",
    type: "email",
    autoComplete: "email",
    placeholder: "you@example.com",
  },
  {
    id: "password",
    label: "Password",
    type: "password",
    autoComplete: "current-password",
    placeholder: "Enter your password",
  },
];

const oauthProviders = [
  { id: "github", label: "GitHub", Icon: FaGithub },
  { id: "google", label: "Google", Icon: FaGoogle },
];

const SignInContent = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const searchParams = useSearchParams();
  const next = normalizeAuthRedirect(searchParams.get("next"));
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleEmailSignIn = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await httpRequest("/api/auth/password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
      });

      if (!response.ok) {
        const payload = await response
          .json()
          .catch(() => ({ error: "We could not sign you in. Try again." }));
        throw new Error(payload.error || "We could not sign you in. Try again.");
      }

      // Reload the app so AuthProvider starts with the newly issued HttpOnly session cookies.
      window.location.assign(next);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "We could not sign you in. Check your connection and try again.",
      );
      setLoading(false);
    }
  };

  const handleOAuthSignIn = (provider) => {
    setLoading(true);
    setError("");
    window.location.assign(`/api/auth/oauth/${provider}?next=${encodeURIComponent(next)}`);
  };

  return (
    <AuthShell page="signIn">
      {error ? (
        <div className={styles.errorAlert} role="alert">
          {error}
        </div>
      ) : null}

      <div
        className={styles.providerGrid}
        role="group"
        aria-label="Social sign-in options"
      >
        {oauthProviders.map(({ id, label, Icon }) => (
          <button
            key={id}
            type="button"
            className={styles.providerButton}
            onClick={() => handleOAuthSignIn(id)}
            disabled={loading}
          >
            <Icon aria-hidden="true" />
            Continue with {label}
          </button>
        ))}
      </div>

      <div className={styles.divider}>or use email</div>

      <Form
        className={styles.form}
        onSubmit={handleEmailSignIn}
        aria-labelledby="signIn-form-title"
        aria-busy={loading}
      >
        {signInFields.map((field) => field.id === "password" ? (
          <PasswordField
            key={field.id}
            {...field}
            value={formData[field.id]}
            onChange={handleChange}
            error={undefined}
            disabled={loading}
            action={(
              <Link href="/authentication/forget-password" className={styles.fieldAction}>
                Reset password
              </Link>
            )}
          />
        ) : (
          <Form.Group key={field.id} controlId={field.id}>
            <div className={styles.fieldLabelRow}>
              <Form.Label>{field.label}</Form.Label>
            </div>
            <Form.Control
              className={styles.input}
              type={field.type}
              name={field.id}
              autoComplete={field.autoComplete}
              placeholder={field.placeholder}
              required
              value={formData[field.id]}
              onChange={handleChange}
              disabled={loading}
            />
          </Form.Group>
        ))}

        <Button
          className={styles.primaryAction}
          variant="primary"
          type="submit"
          disabled={loading}
        >
          {loading ? "Signing in…" : "Sign in"}
        </Button>
      </Form>

      <p className={styles.switchPrompt}>
        New to CommitDiary?{" "}
        <Link href={`/authentication/sign-up?next=${encodeURIComponent(next)}`}>Create an account</Link>
      </p>
    </AuthShell>
  );
};

const SignIn = () => (
  <Suspense fallback={<AuthShell page="signIn" />}>
    <SignInContent />
  </Suspense>
);

export default SignIn;
