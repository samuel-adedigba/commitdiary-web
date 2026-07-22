"use client";

import { Alert, Button, Spinner } from "react-bootstrap";
import { useParams } from "next/navigation";
import ShareViewer from "components/share/ShareViewer";
import { usePublicShare } from "/hooks/usePublicShare";

export default function EmbedSharePage() {
  const params = useParams();
  const username = Array.isArray(params.username) ? params.username[0] : params.username;
  const token = Array.isArray(params.token) ? params.token[0] : params.token;
  const share = usePublicShare(username || "", token || "", "embed");

  if (share.isLoading) {
    return (
      <div className="min-vh-100 d-flex justify-content-center align-items-center bg-white p-4">
        <div className="text-center" role="status" aria-live="polite">
          <Spinner animation="border" variant="primary" size="sm" />
          <p className="small text-muted mt-2 mb-0">Loading shared activity…</p>
        </div>
      </div>
    );
  }

  if (share.error || !share.data) {
    return (
      <div className="min-vh-100 d-flex justify-content-center align-items-center bg-white p-4">
        <Alert variant="danger" className="text-center mb-0" role="alert">
          <p>{share.error?.message || "This shared activity could not be found."}</p>
          <Button size="sm" variant="outline-danger" onClick={share.recover}>
            {share.recoveryLabel}
          </Button>
        </Alert>
      </div>
    );
  }

  return (
    <ShareViewer
      data={share.data}
      username={username || ""}
      token={token || ""}
      variant="embed"
      onRepositoryChange={share.onRepositoryChange}
      onPageChange={share.onPageChange}
      onPageSizeChange={share.onPageSizeChange}
    />
  );
}
