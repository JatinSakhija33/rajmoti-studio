import { createFileRoute, redirect } from "@tanstack/react-router";
export const Route = createFileRoute("/book")({
  validateSearch: (s: Record<string, unknown>) => ({
    service: typeof s.service === "string" ? s.service : undefined,
  }),
  beforeLoad: ({ search }) => {
    throw redirect({ to: "/contact", search: { session: search.service } });
  },
});
