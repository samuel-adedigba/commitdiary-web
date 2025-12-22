"use client";

// import node module libraries
import { Col, Row, Container, Card } from "react-bootstrap";

const ChangeLog = () => {
  return (
    <Container fluid className="p-6">
      <Row>
        <Col lg={12} md={12} sm={12}>
          <div className="border-bottom pb-4 mb-4 d-md-flex justify-content-between align-items-center">
            <div className="mb-3 mb-md-0">
              <h1 className="mb-0 h2 fw-bold">Changelog</h1>
              <p className="mb-0">
                We&apos;re constantly improving &amp; updating Commit Diary. See
                the latest features and improvements.
              </p>
            </div>
          </div>
        </Col>
      </Row>

      <Row>
        <Col lg={12}>
          <Card className="mb-4">
            <Card.Body>
              <h3 className="mb-3">Version 1.1.0</h3>
              <p className="text-muted">Released: December 2024</p>
              <ul>
                <li>Added SVG activity badge for GitHub READMEs</li>
                <li>Implemented language detection for primary stacks</li>
                <li>Optimized commit data with repository name joins</li>
                <li>Enhanced shareable widget with activity heatmap</li>
              </ul>
            </Card.Body>
          </Card>

          <Card>
            <Card.Body>
              <h3 className="mb-3">Version 1.0.0</h3>
              <p className="text-muted">Initial Release</p>
              <ul>
                <li>Dashboard with commit analytics</li>
                <li>Repository management</li>
                <li>Public sharing capabilities</li>
                <li>VS Code extension integration</li>
              </ul>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default ChangeLog;
