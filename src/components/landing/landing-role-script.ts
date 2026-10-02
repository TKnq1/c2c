// Not in landing-role.ts: that's a client module, and the server page that
// inlines this string can't read plain values out of one.
export const LANDING_ROLE_KEY = "landing-role";

// Runs inline before the page paints (see app/page.tsx). ?for=brands or a
// choice made on an earlier visit picks the side straight away, so nobody
// sees the other side flash by. Creators by default.
// Which side shows is then pure CSS on html[data-landing-role] (see
// landing.css), the server's HTML holding both. data-lp-js marks that
// scripts run, so content may wait offscreen to be revealed.
export const LANDING_ROLE_SCRIPT = `try{var d=document.documentElement,f=new URLSearchParams(location.search).get('for'),r=f==='brands'||f==='brand'?'brand':f==='creators'||f==='creator'?'creator':localStorage.getItem('${LANDING_ROLE_KEY}');if(r==='brand'||r==='creator')d.dataset.landingRole=r;d.dataset.lpJs='';}catch(e){}`;
