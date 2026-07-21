"use client";

import { Button, Form } from "react-bootstrap";
import Link from "next/link";
import { useState } from "react";
import AuthShell from "components/auth/AuthShell";
import styles from "components/auth/auth.module.scss";

const signUpFields = [
  {
    id: "username",
    label: "Username",
    type: "text",
    autoComplete: "username",
    placeholder: "your-handle",
  },
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
    autoComplete: "new-password",
    placeholder: "Create a password",
    minLength: 8,
    help: "Use at least 8 characters.",
  },
  {
    id: "confirmPassword",
    label: "Confirm password",
    type: "password",
    autoComplete: "new-password",
    placeholder: "Enter your password again",
    minLength: 8,
  },
];

const SignUp = () => {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [confirmationSent, setConfirmationSent] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
    setFieldErrors((current) => ({ ...current, [name]: "" }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const errors = {};

    if (
      !/^[a-z0-9](?:[a-z0-9_-]{1,28}[a-z0-9])$/.test(
        formData.username.trim().toLowerCase(),
      )
    ) {
      errors.username = "Use 3–30 lowercase letters, numbers, hyphens, or underscores.";
    }
    if (formData.password.length < 8) {
      errors.password = "Use at least 8 characters.";
    }
    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = "Enter the same password in both fields.";
    }

    if (Object.keys(errors).length) {
      setFieldErrors(errors);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/sign-up", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: formData.username,
          email: formData.email,
          password: formData.password,
        }),
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload.error || "We could not create your account. Try again.");
      }

      if (payload.confirmationRequired) {
        setConfirmationSent(true);
        return;
      }

      window.location.assign("/dashboard");
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "We could not create your account. Check your connection and try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  if (confirmationSent) {
    return (
      <AuthShell page="signUp">
        <div className={styles.successAlert} role="status">
          <strong>Check your email</strong>
          <p>
            We sent a confirmation link to {formData.email}. Open it to finish creating your
            account.
          </p>
        </div>
        <p className={styles.switchPrompt}>
          Already confirmed? <Link href="/authentication/sign-in">Sign in</Link>
        </p>
      </AuthShell>
    );
  }

  return (
    <AuthShell page="signUp">
      {error ? (
        <div className={styles.errorAlert} role="alert">
          {error}
        </div>
      ) : null}

      <Form
        className={styles.form}
        aria-labelledby="signUp-form-title"
        aria-busy={loading}
        onSubmit={handleSubmit}
        noValidate
      >
        {signUpFields.map((field) => {
          const helpId = field.help ? `${field.id}-help` : undefined;
          const errorId = fieldErrors[field.id] ? `${field.id}-error` : undefined;
          const describedBy = [helpId, errorId].filter(Boolean).join(" ") || undefined;

          return (
            <Form.Group key={field.id} controlId={field.id}>
              <Form.Label>{field.label}</Form.Label>
              <Form.Control
                className={styles.input}
                type={field.type}
                name={field.id}
                autoComplete={field.autoComplete}
                placeholder={field.placeholder}
                minLength={field.minLength}
                aria-describedby={describedBy}
                aria-invalid={fieldErrors[field.id] ? "true" : undefined}
                required
                value={formData[field.id]}
                onChange={handleChange}
                disabled={loading}
              />
              {field.help ? (
                <Form.Text id={helpId} className={styles.fieldHelp}>
                  {field.help}
                </Form.Text>
              ) : null}
              {fieldErrors[field.id] ? (
                <p id={errorId} className={styles.fieldError} role="alert">
                  {fieldErrors[field.id]}
                </p>
              ) : null}
            </Form.Group>
          );
        })}

        <p className={styles.legalCopy}>
          Review how CommitDiary handles account data in the{" "}
          <Link href="/privacy">Privacy Policy</Link>.
        </p>

        <Button
          className={styles.primaryAction}
          variant="primary"
          type="submit"
          disabled={loading}
        >
          {loading ? "Creating account…" : "Create account"}
        </Button>
      </Form>

      <p className={styles.switchPrompt}>
        Already have an account?{" "}
        <Link href="/authentication/sign-in">Sign in</Link>
      </p>
    </AuthShell>
  );
};

export default SignUp;
