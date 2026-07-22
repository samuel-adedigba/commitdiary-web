"use client";

import { useRef } from "react";
import { Button } from "react-bootstrap";
import { ChevronLeft, ChevronRight } from "react-feather";
import type { ShareRepositorySummary } from "@/src/types/share";

type RepoTabNavigationProps = {
  repos: ShareRepositorySummary[];
  activeRepo: string | null;
  onSelect: (repoName: string) => void;
};

export default function RepoTabNavigation({
  repos,
  activeRepo,
  onSelect,
}: RepoTabNavigationProps) {
  const scrollRef = useRef<HTMLElement>(null);

  const scroll = (direction: "left" | "right") => {
    scrollRef.current?.scrollBy({
      left: direction === "left" ? -240 : 240,
      behavior: "smooth",
    });
  };

  return (
    <div className="position-relative mb-4">
      <div className="d-flex align-items-center gap-2">
        <Button
          type="button"
          variant="link"
          className="p-1 text-muted d-md-none"
          onClick={() => scroll("left")}
          aria-label="Scroll repositories left"
          disabled={repos.length < 2}
        >
          <ChevronLeft size={20} aria-hidden="true" />
        </Button>

        <nav
          ref={scrollRef}
          className="flex-grow-1 overflow-auto no-scrollbar"
          aria-label="Shared repositories"
        >
          <div className="d-flex flex-nowrap gap-2 py-2">
            {repos.map((repo) => {
              const active = activeRepo === repo.repo_name;
              return (
                <Button
                  key={repo.repo_name}
                  type="button"
                  aria-current={active ? "page" : undefined}
                  variant={active ? "primary" : "light"}
                  onClick={() => onSelect(repo.repo_name)}
                  className="rounded-pill px-3 px-md-4 py-2 border text-nowrap"
                >
                  <span className="fw-semibold small">{repo.repo_name}</span>
                  <BadgeCount count={repo.total_commits} active={active} />
                </Button>
              );
            })}
          </div>
        </nav>

        <Button
          type="button"
          variant="link"
          className="p-1 text-muted d-md-none"
          onClick={() => scroll("right")}
          aria-label="Scroll repositories right"
          disabled={repos.length < 2}
        >
          <ChevronRight size={20} aria-hidden="true" />
        </Button>
      </div>

      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}

function BadgeCount({ count, active }: { count: number; active: boolean }) {
  return (
    <span className={`ms-2 badge rounded-pill ${active ? "bg-white text-primary" : "bg-secondary-subtle text-dark"}`}>
      {count}
    </span>
  );
}
