import {useSyncExternalStore} from "react";
let ready=false;
export function setGiftCheckoutReady(value:boolean){if(ready!==value){ready=value;window.dispatchEvent(new Event("rajmoti-checkout-status"));}}
export function useGiftCheckoutReady(){return useSyncExternalStore(listener=>{window.addEventListener("rajmoti-checkout-status",listener);return()=>window.removeEventListener("rajmoti-checkout-status",listener);},()=>ready,()=>false);}
