// import node module libraries
import { Card, Badge } from "react-bootstrap";

const RecentCommits = ({ commits, getCategoryColor, formatDate }) => {
  return (
    <Card className="h-100">
      <Card.Header>
        <h4 className="mb-0">Recent Commits</h4>
      </Card.Header>
      <Card.Body>
        {!Array.isArray(commits) || commits.length === 0 ? (
          <p className="text-muted text-center py-4">No commits yet</p>
        ) : (
          <div className="list-group list-group-flush">
            {commits.map((commit, idx) => (
              <div key={commit.id || idx} className="list-group-item px-0">
                <div className="d-flex justify-content-between align-items-start">
                  <div className="flex-grow-1">
                    <h6 className="mb-1">{commit.message}</h6>
                    <div className="d-flex gap-2 align-items-center">
                      <small className="text-muted">{commit.repo_name}</small>
                      <Badge
                        bg={getCategoryColor(commit.category)}
                        className="text-uppercase"
                        style={{ fontSize: "0.7rem" }}
                      >
                        {commit.category || "uncategorized"}
                      </Badge>
                    </div>
                  </div>
                  <small className="text-muted">
                    {formatDate(commit.committed_at || commit.created_at)}
                  </small>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card.Body>
    </Card>
  );
};

export default RecentCommits;
