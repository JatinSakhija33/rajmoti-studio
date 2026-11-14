import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/gifts")({
  beforeLoad: ({ search }) => {
    throw redirect({
      to: "/products",
      search,
    });
  },
  component: () => null,
});

