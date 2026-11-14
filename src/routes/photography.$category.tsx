import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/photography/$category")({
  component: PhotographyCategoryRedirect,
});

function PhotographyCategoryRedirect() {
  const { category } = Route.useParams();
  return <Navigate to="/portfolios/$category" params={{ category }} replace />;
}
