import { createFileRoute } from "@tanstack/react-router";
import { StoreHome } from "@/features/catalogue/store-home";
export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Rajmoti Studio — Photo gifts, printed memories & photography" },
      {
        name: "description",
        content:
          "Explore personalized photo gifts, frames, prints and albums. Preview your ideas and discover Rajmoti Studio photography.",
      },
    ],
  }),
  component: StoreHome,
});
