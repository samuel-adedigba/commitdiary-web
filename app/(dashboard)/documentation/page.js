"use client";

import { Fragment, useState } from "react";
import Link from "next/link";
import {
  Container,
  Row,
  Col,
  Card,
  Nav,
  Tab,
  Button,
  Alert,
} from "react-bootstrap";
import {
  Copy,
  Terminal,
  Shield,
  Share2,
  GitHub,
  CheckCircle,
} from "react-feather";
import { CopyToClipboard } from "react-copy-to-clipboard";

const Documentation = () => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const badgeMarkdown = `[![CommitDiary](https://commitdiary-web.vercel.app/api/badge/YOUR_USERNAME/YOUR_SHARE_TOKEN)](https://commitdiary-web.vercel.app/s/YOUR_USERNAME/YOUR_SHARE_TOKEN)`;

  return (
    <Fragment>
      <div className="bg-primary pt-10 pb-21"></div>
      <Container fluid className="mt-n22 px-6">
        <Row>
          <Col lg={12} md={12} xs={12}>
            <div className="d-flex justify-content-between align-items-center mb-4">
              <div className="mb-2 mb-lg-0">
                <h3 className="mb-0 text-white">Documentation</h3>
                <p className="mb-0 text-white-50">
                  Everything you need to know about setting up and using
                  CommitDiary.
                </p>
              </div>
            </div>
          </Col>
        </Row>

        <Row className="mb-6">
          <Col xl={12} lg={12} md={12} xs={12}>
            <Tab.Container defaultActiveKey="getting-started">
              <Card>
                <Card.Header className="border-bottom-0 p-0 bg-white">
                  <Nav className="nav-lb-tab">
                    <Nav.Item>
                      <Nav.Link
                        eventKey="getting-started"
                        className="mb-sm-3 mb-md-0"
                      >
                        <Terminal size={18} className="me-2 align-middle" />
                        Getting Started
                      </Nav.Link>
                    </Nav.Item>
                    <Nav.Item>
                      <Nav.Link eventKey="shares" className="mb-sm-3 mb-md-0">
                        <Share2 size={18} className="me-2 align-middle" />
                        Shares & Live Mode
                      </Nav.Link>
                    </Nav.Item>
                    <Nav.Item>
                      <Nav.Link eventKey="github" className="mb-sm-3 mb-md-0">
                        <GitHub size={18} className="me-2 align-middle" />
                        GitHub Integration
                      </Nav.Link>
                    </Nav.Item>
                  </Nav>
                </Card.Header>
                <Card.Body className="p-0">
                  <Tab.Content>
                    {/* Getting Started Tab */}
                    <Tab.Pane eventKey="getting-started" className="pb-4 p-4">
                      <div className="mb-4">
                        <h2 className="mb-1 fw-bold">Setting up CommitDiary</h2>
                        <p className="text-muted">
                          Follow these steps to start tracking your coding
                          journey directly from VS Code.
                        </p>
                      </div>

                      <Row>
                        <Col lg={6}>
                          <div className="d-flex mb-4">
                            <div className="icon-shape icon-md bg-light-primary text-primary rounded-circle me-3">
                              <span className="fs-4 fw-bold">1</span>
                            </div>
                            <div>
                              <h4 className="fw-bold">Install the Extension</h4>
                              <p className="mb-0">
                                Search for <strong>CommitDiary</strong> in the
                                VS Code Marketplace and install it.
                              </p>
                            </div>
                          </div>
                        </Col>
                        <Col lg={6}>
                          <div className="d-flex mb-4">
                            <div className="icon-shape icon-md bg-light-primary text-primary rounded-circle me-3">
                              <span className="fs-4 fw-bold">2</span>
                            </div>
                            <div>
                              <h4 className="fw-bold">Generate API Key</h4>
                              <p className="mb-0">
                                Go to the <Link href="/settings">Settings</Link>{" "}
                                page on this dashboard and generate a new API
                                Key.
                                <br />
                                <small className="text-muted">
                                  Keep this key safe! You won't be able to see
                                  it again.
                                </small>
                              </p>
                            </div>
                          </div>
                        </Col>
                        <Col lg={12}>
                          <div className="d-flex mb-4">
                            <div className="icon-shape icon-md bg-light-primary text-primary rounded-circle me-3">
                              <span className="fs-4 fw-bold">3</span>
                            </div>
                            <div>
                              <h4 className="fw-bold">Connect VS Code</h4>
                              <p>
                                Open VS Code, press <code>Cmd+Shift+P</code> (or{" "}
                                <code>Ctrl+Shift+P</code>) and run:
                                <br />
                                <code className="d-block mt-2 p-2 bg-light rounded">
                                  CommitDiary: Set API Key
                                </code>
                              </p>
                              <p className="mb-0 mt-2">
                                Paste your key and hit Enter. You're ready to
                                go!
                              </p>
                            </div>
                          </div>
                        </Col>
                      </Row>
                    </Tab.Pane>

                    {/* Shares Tab */}
                    <Tab.Pane eventKey="shares" className="pb-4 p-4">
                      <div className="mb-4">
                        <h2 className="mb-1 fw-bold">Sharing Your Work</h2>
                        <p className="text-muted">
                          Create public links to showcase your commit history
                          securely.
                        </p>
                      </div>

                      <div className="mb-5">
                        <h4 className="fw-bold mb-3">Creating a Share Link</h4>
                        <p>
                          Navigate to the <Link href="/shares">Shares</Link>{" "}
                          page and click "Create Share". You can customize:
                        </p>
                        <ul>
                          <li>
                            <strong>Repositories:</strong> Choose which repos to
                            include (or select All).
                          </li>
                          <li>
                            <strong>Date Range:</strong> Limit the history to a
                            specific timeframe.
                          </li>
                          <li>
                            <strong>Live Mode:</strong> If enabled, the data
                            updates automatically as you push new code.
                          </li>
                        </ul>
                      </div>

                      <Alert
                        variant="info"
                        className="d-flex align-items-center"
                      >
                        <Shield className="me-2" size={24} />
                        <div>
                          <strong>Privacy First:</strong> We never share your
                          source code. Only metadata (commit messages, dates,
                          stats) is shared. Your email address is strictly
                          hidden in all public links.
                        </div>
                      </Alert>
                    </Tab.Pane>

                    {/* GitHub Tab */}
                    <Tab.Pane eventKey="github" className="pb-4 p-4">
                      <div className="mb-4">
                        <h2 className="mb-1 fw-bold">GitHub Profile Badge</h2>
                        <p className="text-muted">
                          Display your "Last Active" status and commit stats on
                          your GitHub profile.
                        </p>
                      </div>

                      <Row className="align-items-center mb-4">
                        <Col lg={6}>
                          <p>
                            Once you have created a <strong>Share Link</strong>,
                            you can use its unique ID to generate a dynamic SVG
                            badge. This badge updates automatically (cached for
                            performance).
                          </p>
                          <h5 className="mt-3">How to add it:</h5>
                          <ol>
                            <li>
                              Create a Share Link with "All Repos" and "Live
                              Mode" enabled.
                            </li>
                            <li>Copy the markdown snippet below.</li>
                            <li>
                              Replace <code>YOUR_USERNAME</code> and{" "}
                              <code>YOUR_TOKEN</code> with values from your
                              share link URL.
                            </li>
                            <li>
                              Paste into your GitHub <code>README.md</code>.
                            </li>
                          </ol>
                        </Col>
                        <Col lg={6} className="text-center">
                          <div className="p-4 bg-light rounded border">
                            <p className="text-muted mb-2 text-uppercase fw-bold text-xs letter-spacing-2">
                              Preview
                            </p>
                            {/* Placeholder for visual representation */}
                            <img
                              src="https://img.shields.io/badge/CommitDiary-Stats_Loading...-blue?style=for-the-badge&logo=git"
                              alt="Badge Preview"
                              className="img-fluid"
                              style={{ height: "30px" }}
                            />
                            <p className="mt-3 small text-muted">
                              (Actual badge effectively replaces this with your
                              live stats graph)
                            </p>
                          </div>
                        </Col>
                      </Row>

                      <div className="bg-dark rounded p-3 position-relative">
                        <CopyToClipboard
                          text={badgeMarkdown}
                          onCopy={handleCopy}
                        >
                          <Button
                            size="sm"
                            variant="white"
                            className="position-absolute top-0 end-0 m-2 start-0"
                            style={{ width: "fit-content", left: "auto" }}
                          >
                            {copied ? (
                              <CheckCircle
                                size={14}
                                className="text-success me-1"
                              />
                            ) : (
                              <Copy size={14} className="me-1" />
                            )}
                            {copied ? "Copied!" : "Copy Snippet"}
                          </Button>
                        </CopyToClipboard>
                        <code
                          className="text-white text-break"
                          style={{ fontFamily: "monospace" }}
                        >
                          {badgeMarkdown}
                        </code>
                      </div>
                    </Tab.Pane>
                  </Tab.Content>
                </Card.Body>
              </Card>
            </Tab.Container>
          </Col>
        </Row>
      </Container>
    </Fragment>
  );
};

export default Documentation;
