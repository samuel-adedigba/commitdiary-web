"use client";

import { Button, Form } from "react-bootstrap";
import Link from "next/link";
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
  return (
    <AuthShell page="signUp">
      <Form
        className={styles.form}
        aria-labelledby="signUp-form-title"
      >
        {signUpFields.map((field) => {
          const helpId = field.help ? `${field.id}-help` : undefined;

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
                aria-describedby={helpId}
                required
              />
              {field.help ? (
                <Form.Text id={helpId} className={styles.fieldHelp}>
                  {field.help}
                </Form.Text>
              ) : null}
            </Form.Group>
          );
        })}

        <p className={styles.legalCopy}>
          Review how CommitDiary handles account data in the{" "}
          <Link href="/privacy">Privacy Policy</Link>.
        </p>

        <Button className={styles.primaryAction} variant="primary" type="submit">
          Create account
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
