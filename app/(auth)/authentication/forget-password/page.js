'use client';

import { Button, Form } from 'react-bootstrap';
import Link from 'next/link';
import AuthShell from 'components/auth/AuthShell';
import styles from 'components/auth/auth.module.scss';

const ForgetPassword = () => {
  return (
    <AuthShell page="resetPassword">
      <Form className={styles.form} aria-labelledby="resetPassword-form-title">
        <Form.Group controlId="email">
          <Form.Label>Email address</Form.Label>
          <Form.Control
            className={styles.input}
            type="email"
            name="email"
            autoComplete="email"
            placeholder="you@example.com"
            required
          />
        </Form.Group>

        <Button className={styles.primaryAction} variant="primary" type="submit">
          Send reset link
        </Button>
      </Form>

      <p className={styles.switchPrompt}>
        Remembered your password?{' '}
        <Link href="/authentication/sign-in">Sign in</Link>
      </p>
    </AuthShell>
  );
};

export default ForgetPassword;
