import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

export const getRouter = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60_000,
        gcTime: 10 * 60_000,
        refetchOnWindowFocus: false,
        retry: (failures, error) => {
          const detail = error instanceof Error ? error.message : String(error);
          // A missing table or denied access is a schema issue, not transient.
          if (/PGRST205|42P01|42501|could not find the table|relation .* does not exist|permission denied/i.test(detail)) return false;
          return failures < 1;
        },
      },
    },
  });

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreloadStaleTime: 30_000,
  });

  return router;
};
