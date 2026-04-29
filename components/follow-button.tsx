"use client";

import { Bell, BellOff } from "lucide-react";
import { useTransition } from "react";
import { followService, unfollowService } from "@/lib/actions/user";

type FollowButtonProps = {
  serviceId: string;
  serviceSlug: string;
  isFollowing: boolean;
  isLoggedIn: boolean;
};

export function FollowButton({ serviceId, serviceSlug, isFollowing, isLoggedIn }: FollowButtonProps) {
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
      onClick={() =>
        startTransition(() =>
          void (isFollowing ? unfollowService(serviceId, serviceSlug) : followService(serviceId, serviceSlug)),
        )
      }
    >
      {isFollowing ? <BellOff size={16} /> : <Bell size={16} />}
      {pending ? "Saving..." : isFollowing ? "Following" : "Follow updates"}
    </button>
  );
}
