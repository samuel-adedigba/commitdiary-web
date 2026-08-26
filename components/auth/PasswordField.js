"use client";

import { Form } from "react-bootstrap";
import { useId, useState } from "react";
import styles from "./auth.module.scss";

export default function PasswordField({
  id,
  label,
  name = id,
  value,
  onChange,
  placeholder,
  autoComplete = "current-password",
  help,
  error,
  action,
  disabled = false,
}) {
  const [visible, setVisible] = useState(false);
  const helpId = useId();
  const errorId = useId();
  const describedBy = [help ? helpId : null, error ? errorId : null].filter(Boolean).join(" ") || undefined;

  return (
    <Form.Group controlId={id}>
      <div className={styles.fieldLabelRow}>
        <Form.Label>{label}</Form.Label>
        {action}
        <button
          type="button"
          className={styles.passwordToggle}
          onClick={() => setVisible((current) => !current)}
          aria-pressed={visible}
          disabled={disabled}
        >
          {visible ? "Hide password" : "Show password"}
        </button>
      </div>
      <Form.Control
        className={styles.input}
        type={visible ? "text" : "password"}
        name={name}
        autoComplete={autoComplete}
        placeholder={placeholder}
        required
        value={value}
        onChange={onChange}
        disabled={disabled}
        aria-describedby={describedBy}
        aria-invalid={error ? "true" : undefined}
      />
      {help ? <Form.Text id={helpId} className={styles.fieldHelp}>{help}</Form.Text> : null}
      {error ? <p id={errorId} className={styles.fieldError} role="alert">{error}</p> : null}
    </Form.Group>
  );
}
