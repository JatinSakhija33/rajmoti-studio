import { createFileRoute, redirect } from "@tanstack/react-router";
// An alias into the original gift section; the photography site remains the root experience.
export const Route=createFileRoute("/products")({beforeLoad:({search})=>{throw redirect({to:"/gifts",search});}});
