"use client";

import { Alert, Button, Card, Container, Spinner } from "react-bootstrap";
import { useParams } from "next/navigation";
import ShareViewer from "components/share/ShareViewer";
import { usePublicShare } from "/hooks/usePublicShare";

export default function PublicSharePage() {
  const params = useParams();
  const username = Array.isArray(params.username) ? params.username[0] : params.username;
  const token = Array.isArray(params.token) ? params.token[0] : params.token;
  const share = usePublicShare(username || "", token || "", "full");

  if (share.isLoading) {
    return (
      <Container fluid className="min-vh-100 d-flex justify-content-center align-items-center p-4">
        <div className="text-center" role="status" aria-live="polite">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3 mb-0 text-muted">Loading shared activity…</p>
        </div>
      </Container>
    );
  }

  if (share.error || !share.data) {
    return (
      <Container fluid className="min-vh-100 d-flex align-items-center justify-content-center p-4">
        <Card className="border-0 shadow-sm w-100" style={{ maxWidth: 640 }}>
          <Card.Body className="p-4 p-md-5 text-center">
            <h1 className="h3 text-danger mb-3">Share link unavailable</h1>
            <p className="text-muted">
              {share.error?.message || "This shared activity could not be found."}
            </p>
            <Button variant="outline-primary" onClick={share.recover}>
              {share.recoveryLabel}
            </Button>
          </Card.Body>
        </Card>
      </Container>
    );
  }

  return (
    <Container fluid className="min-vh-100 bg-light p-3 p-md-4">
      <div className="mx-auto" style={{ maxWidth: 1000 }}>
        {share.isRefreshing ? (
          <Alert variant="info" role="status">Updating shared activity…</Alert>
        ) : null}
        <ShareViewer
          data={share.data}
          username={username || ""}
          token={token || ""}
          onRepositoryChange={share.onRepositoryChange}
          onPageChange={share.onPageChange}
          onPageSizeChange={share.onPageSizeChange}
        />
      </div>
    </Container>
  );
}
