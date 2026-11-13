import { createRoot } from "react-dom/client";
import { RouterProvider } from "@tanstack/react-router";
import { getRouter } from "./router";
import "./styles.css";
import "./features/editorial/editorial.css";
import { installDemoGuards } from "./demo/guards";
installDemoGuards();
createRoot(document.getElementById("root")!).render(<RouterProvider router={getRouter()} />);
