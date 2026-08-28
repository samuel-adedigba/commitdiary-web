"use client";

import { useRef, useState } from "react";
import { Button, Card, Col, Form, Image, Row } from "react-bootstrap";
import { useAuth } from "lib/auth-context";
import { getProfileAvatarUrl, getProfileCoverUrl } from "lib/profilePresentation";
import { httpRequest } from "lib/httpClient";

export default function GeneralSetting() {
  const { user, loading, refreshUser } = useAuth();
  const [fullName, setFullName] = useState(null);
  const [avatarUrl, setAvatarUrl] = useState("");
  const [coverUrl, setCoverUrl] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const avatarInput = useRef(null);
  const coverInput = useRef(null);
  const metadata = user?.user_metadata || {};
  const displayedAvatar = avatarUrl || getProfileAvatarUrl(user);
  const displayedCover = coverUrl || getProfileCoverUrl(user);

  const saveProfile = async (event) => {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    try {
      const response = await httpRequest("/api/auth/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ full_name: fullName ?? metadata.full_name ?? "" }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || "We could not save your profile.");
      await refreshUser();
      setMessage("Profile saved.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "We could not save your profile.");
    } finally {
      setSaving(false);
    }
  };

  const uploadPhoto = async (kind, file) => {
    if (!file) return;
    const preview = URL.createObjectURL(file);
    if (kind === "avatar") setAvatarUrl(preview);
    else setCoverUrl(preview);
    const formData = new FormData();
    formData.append("kind", kind);
    formData.append("file", file);
    setMessage("");
    try {
      const response = await httpRequest("/api/auth/profile", { method: "POST", body: formData });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || "We could not upload that image.");
      if (kind === "avatar") setAvatarUrl(payload.url);
      else setCoverUrl(payload.url);
      await refreshUser();
      setMessage(`${kind === "avatar" ? "Profile" : "Cover"} photo updated.`);
    } catch (error) {
      if (kind === "avatar") setAvatarUrl("");
      else setCoverUrl("");
      setMessage(error instanceof Error ? error.message : "We could not upload that image.");
    } finally {
      URL.revokeObjectURL(preview);
    }
  };

  if (loading) return null;

  return (
    <Row className="mb-8">
      <Col xl={3} lg={4} md={12} xs={12}>
        <div className="mb-4 mb-lg-0">
          <h4 className="mb-1">Account settings</h4>
          <p className="mb-0 fs-5 text-muted">Manage your name and profile photos.</p>
        </div>
      </Col>
      <Col xl={9} lg={8} md={12} xs={12}>
        <Card>
          <Card.Body>
            <h4 className="mb-6">Profile</h4>
            <div className="mb-6">
              <h5 className="mb-1">Profile photo</h5>
              <p className="text-muted mb-3">Your Google photo appears here automatically when available.</p>
              <div className="d-flex align-items-center gap-3">
                <Image src={displayedAvatar} className="rounded-circle avatar avatar-lg" alt="Profile" />
                <div>
                  <input ref={avatarInput} hidden type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => uploadPhoto("avatar", event.target.files?.[0])} />
                  <Button variant="outline-white" type="button" onClick={() => avatarInput.current?.click()}>Upload new photo</Button>
                </div>
              </div>
            </div>
            <div className="mb-6">
              <h5 className="mb-1">Cover photo</h5>
              <p className="text-muted mb-3">Add a wide image to personalize your profile.</p>
              {displayedCover ? <Image src={displayedCover} className="w-100 rounded mb-3" alt="Cover" style={{ maxHeight: 180, objectFit: "cover" }} /> : null}
              <input ref={coverInput} hidden type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => uploadPhoto("cover", event.target.files?.[0])} />
              <Button variant="outline-white" type="button" onClick={() => coverInput.current?.click()}>Upload cover photo</Button>
            </div>
            <Form onSubmit={saveProfile}>
              <Form.Group className="mb-3" controlId="fullName">
                <Form.Label>Full name</Form.Label>
                <Form.Control value={fullName ?? metadata.full_name ?? ""} onChange={(event) => setFullName(event.target.value)} placeholder="Your name" maxLength={120} />
              </Form.Group>
              <Form.Group className="mb-4" controlId="email">
                <Form.Label>Email address</Form.Label>
                <Form.Control type="email" value={user?.email || ""} readOnly aria-describedby="email-help" />
                <Form.Text id="email-help">Your sign-in email is managed by your authentication provider.</Form.Text>
              </Form.Group>
              {message ? <p role="status" className="text-muted">{message}</p> : null}
              <Button variant="primary" type="submit" disabled={saving}>{saving ? "Saving…" : "Save profile"}</Button>
            </Form>
          </Card.Body>
        </Card>
      </Col>
    </Row>
  );
}
