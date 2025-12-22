import React, { useRef } from "react";
import { Nav, Button } from "react-bootstrap";
import { ChevronLeft, ChevronRight } from "react-feather";

const RepoTabNavigation = ({ repos, activeRepo, onSelect }) => {
  const scrollRef = useRef(null);

  const scroll = (direction) => {
    if (scrollRef.current) {
      const scrollAmount = 200;
      scrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  return (
    <div className="position-relative mb-4">
      <div className="d-flex align-items-center gap-2">
        <Button
          variant="link"
          className="p-0 text-muted d-md-none"
          onClick={() => scroll("left")}
        >
          <ChevronLeft size={20} />
        </Button>

        <div
          ref={scrollRef}
          className="flex-grow-1 overflow-auto no-scrollbar"
          style={{ whiteSpace: "nowrap" }}
        >
          <Nav variant="pills" className="flex-nowrap gap-2 py-2">
            {repos.map((repo) => (
              <Nav.Item key={repo.repo_name}>
                <Nav.Link
                  active={activeRepo === repo.repo_name}
                  onClick={() => onSelect(repo.repo_name)}
                  className={`rounded-pill px-4 py-2 border ${
                    activeRepo === repo.repo_name
                      ? "bg-primary text-white border-primary shadow"
                      : "bg-white text-dark"
                  }`}
                  style={{ transition: "all 0.2s ease" }}
                >
                  <span className="fw-semibold small">{repo.repo_name}</span>
                  {repo.commit_count > 0 && (
                    <span
                      className={`ms-2 badge rounded-pill ${
                        activeRepo === repo.repo_name
                          ? "bg-white text-primary"
                          : "bg-light text-muted"
                      }`}
                    >
                      {repo.commit_count}
                    </span>
                  )}
                </Nav.Link>
              </Nav.Item>
            ))}
          </Nav>
        </div>

        <Button
          variant="link"
          className="p-0 text-muted d-md-none"
          onClick={() => scroll("right")}
        >
          <ChevronRight size={20} />
        </Button>
      </div>

      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
};

export default RepoTabNavigation;
