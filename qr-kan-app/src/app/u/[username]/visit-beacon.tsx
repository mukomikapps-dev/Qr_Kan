/* eslint-disable */
"use client";
import { useEffect } from "react";

export default function VisitBeacon({ username }: { username: string }) {
  useEffect(() => {
    const img = new Image(1, 1);
    img.referrerPolicy = "no-referrer-when-downgrade";
    img.src = `/api/visit/${encodeURIComponent(username)}`;
  }, [username]);
  return null;
}
