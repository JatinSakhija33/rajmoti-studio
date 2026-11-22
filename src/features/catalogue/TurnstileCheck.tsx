import { useEffect, useRef, useState } from "react";
declare global { interface Window { turnstile?: { render: (element: HTMLElement, options: Record<string, unknown>) => string; remove: (id: string) => void; reset: (id: string) => void; }; } }
let loading: Promise<void> | undefined;
function loadWidget() {
  if (window.turnstile) return Promise.resolve();
  if (!loading) loading = new Promise<void>((resolve, reject) => {
    const script = document.createElement("script"); script.src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"; script.async=true;
    script.onload=()=>resolve(); script.onerror=()=>{script.remove();loading=undefined;reject(Error("The verification service could not load. Please retry."));}; document.head.appendChild(script);
  });
  return loading;
}
export function TurnstileCheck({ siteKey, onToken }: { siteKey: string; onToken: (token: string) => void }) {
  const ref=useRef<HTMLDivElement>(null);const callback=useRef(onToken);callback.current=onToken;
  const [error,setError]=useState("");const [retry,setRetry]=useState(0);
  useEffect(()=>{let cancelled=false;let id:string|undefined;
    loadWidget().then(()=>{if(cancelled||!ref.current||!window.turnstile)return;id=window.turnstile.render(ref.current,{sitekey:siteKey,theme:"light",size:"flexible",callback:(token:string)=>callback.current(token),"expired-callback":()=>callback.current(""),"error-callback":()=>{callback.current("");setError("Please retry the verification check.");}});}).catch(e=>{if(!cancelled)setError(e.message);});
    return()=>{cancelled=true;if(id&&window.turnstile)window.turnstile.remove(id);callback.current("");};
  },[siteKey,retry]);
  return <div><div ref={ref}/>{error&&<p role="alert">{error}<button type="button" onClick={()=>{setError("");setRetry(v=>v+1);}}>Retry verification</button></p>}</div>;
}
