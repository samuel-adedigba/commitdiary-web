"use client";

import { Button, Form } from "react-bootstrap";
import Link from "next/link";
import { useState } from "react";
import AuthShell from "components/auth/AuthShell";
import styles from "components/auth/auth.module.scss";

const resetFields = [
  {
    id: "password",
    label: "New password",
    placeholder: "Create a new password",
  },
  {
    id: "confirmPassword",
    label: "Confirm new password",
    placeholder: "Enter your new password again",
  },
];

export default function ResetPassword() {
  const [formData, setFormData] = useState({ password: "", confirmPassword: "" });
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
    setFieldErrors((current) => ({ ...current, [name]: "" }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const errors = {};

    if (formData.password.length < 8) errors.password = "Use at least 8 characters.";
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
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: formData.password }),
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload.error || "We could not update your password. Try again.");
      }

      window.location.assign("/dashboard");
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "We could not update your password. Check your connection and try again.",
      );
      setLoading(false);
    }
  };

  return (
    <AuthShell page="newPassword">
      {error ? (
        <div className={styles.errorAlert} role="alert">
          {error}{" "}
          {error.includes("expired") ? (
            <Link href="/authentication/forget-password">Request a new reset link</Link>
          ) : null}
        </div>
      ) : null}

      <Form
        className={styles.form}
        aria-labelledby="newPassword-form-title"
        aria-busy={loading}
        onSubmit={handleSubmit}
        noValidate
      >
        {resetFields.map((field) => {
          const errorId = fieldErrors[field.id] ? `${field.id}-error` : undefined;

          return (
            <Form.Group key={field.id} controlId={field.id}>
              <Form.Label>{field.label}</Form.Label>
              <Form.Control
                className={styles.input}
                type="password"
                name={field.id}
                autoComplete="new-password"
                placeholder={field.placeholder}
                minLength={8}
                required
                value={formData[field.id]}
                onChange={handleChange}
                aria-describedby={errorId}
                aria-invalid={fieldErrors[field.id] ? "true" : undefined}
                disabled={loading}
              />
              {fieldErrors[field.id] ? (
                <p id={errorId} className={styles.fieldError} role="alert">
                  {fieldErrors[field.id]}
                </p>
              ) : null}
            </Form.Group>
          );
        })}

        <p className={styles.fieldHelp}>Use at least 8 characters.</p>

        <Button
          className={styles.primaryAction}
          variant="primary"
          type="submit"
          disabled={loading}
        >
          {loading ? "Updating password…" : "Update password"}
        </Button>
      </Form>
    </AuthShell>
  );
}
