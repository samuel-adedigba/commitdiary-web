// import node module libraries
import { Card, Badge } from "react-bootstrap";

const ActiveRepositories = ({ repositories }) => {
  return (
    <Card className="h-100">
      <Card.Header>
        <h4 className="mb-0">Active Repositories</h4>
      </Card.Header>
      <Card.Body>
        {!Array.isArray(repositories) || repositories.length === 0 ? (
          <p className="text-muted text-center py-4">No repositories synced</p>
        ) : (
          <div className="list-group list-group-flush">
            {repositories.slice(0, 5).map((repo, idx) => (
              <div key={repo.id || idx} className="list-group-item px-0">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <h6 className="mb-1">{repo.name}</h6>
                    <small className="text-muted">
                      {repo.commit_count || 0} commits
                    </small>
                  </div>
                  <Badge bg="light" text="dark">
                    {repo.branch || "main"}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card.Body>
    </Card>
  );
};

export default ActiveRepositories;
