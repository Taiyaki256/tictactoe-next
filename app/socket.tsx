"use client";
import { io } from "socket.io-client";

let url =
  process.env.NEXT_PUBLIC_DEBUG === "true"
    ? "http://localhost:3000"
    : "https://websocket-deno.deno.dev";

export const socket = io(url, {
  path: "/socket.io/",
  transports: ["websocket", "polling", "webtransport"],
  autoConnect: true,
  reconnection: true,
  withCredentials: true,
});
