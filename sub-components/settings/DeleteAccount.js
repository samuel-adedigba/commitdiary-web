// import node module libraries
import { Col, Row, Card } from "react-bootstrap";
import { legalConfig } from "lib/legalConfig";

const deletionRequestHref = `mailto:${legalConfig.supportEmail}?subject=${encodeURIComponent("CommitDiary account deletion request")}`;

const DeleteAccount = () => {
  return (
    <Row>
      <Col xl={3} lg={4} md={12} xs={12}>
        <div className="mb-4 mb-lg-0">
          <h4 className="mb-1">Delete Account</h4>
          <p className="mb-0 fs-5 text-muted">
            Remove your CommitDiary account and work data
          </p>
        </div>
      </Col>
      <Col xl={9} lg={8} md={12} xs={12}>
        <Card className="mb-6">
          <Card.Body>
            <div className="mb-6">
              <h4 className="mb-1">Danger Zone </h4>
            </div>
            <div>
              <p>
                Request deletion of your account, repositories, commits, reports,
                shares, and connected settings. We may retain limited records when
                needed for billing, security, disputes, or a legal obligation.
              </p>
              <a
                href={deletionRequestHref}
                className="btn btn-danger"
              >
                Request account deletion
              </a>
              <p className="small mb-0 mt-3">
                We will verify account ownership before acting. Questions?{" "}
                <a href={`mailto:${legalConfig.supportEmail}`}>Email {legalConfig.supportEmail}</a>.
              </p>
            </div>
          </Card.Body>
        </Card>
      </Col>
    </Row>
  );
};

export default DeleteAccount;
