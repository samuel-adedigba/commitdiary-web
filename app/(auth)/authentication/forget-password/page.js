"use client";

import { Button, Form } from "react-bootstrap";
import Link from "next/link";
import { useState } from "react";
import AuthShell from "components/auth/AuthShell";
import styles from "components/auth/auth.module.scss";

const ForgetPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/recover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload.error || "We could not send the reset link. Try again.");
      }

      setSent(true);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "We could not send the reset link. Check your connection and try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell page="resetPassword">
      {sent ? (
        <div className={styles.successAlert} role="status">
          <strong>Check your email</strong>
          <p>
            If an account exists for {email}, we sent a password reset link. The link expires
            soon, so open it when it arrives.
          </p>
        </div>
      ) : (
        <>
          {error ? (
            <div className={styles.errorAlert} role="alert">
              {error}
            </div>
          ) : null}
          <Form
            className={styles.form}
            aria-labelledby="resetPassword-form-title"
            aria-busy={loading}
            onSubmit={handleSubmit}
          >
            <Form.Group controlId="email">
              <Form.Label>Email address</Form.Label>
              <Form.Control
                className={styles.input}
                type="email"
                name="email"
                autoComplete="email"
                placeholder="you@example.com"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                disabled={loading}
              />
            </Form.Group>

            <Button
              className={styles.primaryAction}
              variant="primary"
              type="submit"
              disabled={loading}
            >
              {loading ? "Sending reset link…" : "Send reset link"}
            </Button>
          </Form>
        </>
      )}

      <p className={styles.switchPrompt}>
        Remembered your password?{" "}
        <Link href="/authentication/sign-in">Sign in</Link>
      </p>
    </AuthShell>
  );
};

export default ForgetPassword;
