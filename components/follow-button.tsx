"use client";

import { Bell, BellOff } from "lucide-react";
import { useTransition } from "react";
import { toggleFollowService } from "@/lib/actions/user";

type FollowButtonProps = {
  serviceId: string;
  isFollowing: boolean;
  isLoggedIn: boolean;
};

export function FollowButton({ serviceId, isFollowing, isLoggedIn }: FollowButtonProps) {
  const [pending, startTransition] = useTransition();

  if (!isLoggedIn) {
    return (
      <a className="btn btn-primary" href="/login">
        Sign in to follow updates
      </a>
    );
  }

  return (
    <button
      className={isFollowing ? "btn btn-secondary" : "btn btn-primary"}
      disabled={pending}
      onClick={() => startTransition(() => void toggleFollowService(serviceId, isFollowing))}
    >
      {isFollowing ? <BellOff size={16} /> : <Bell size={16} />}
      {pending ? "Saving..." : isFollowing ? "Following" : "Follow updates"}
    </button>
  );
}
