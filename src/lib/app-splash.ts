// Not in app-splash.tsx: that's a client module, and the server layout that
// inlines this string can't read plain values out of one.
export const SPLASH_SEEN_KEY = "splash-seen";

// Selector of the empty marker the root layout renders as its Suspense
// fallback (see layout.tsx). While it's in the document, the page behind the
// splash is still streaming in from the server, e.g. waiting on a Neon
// database that is waking up.
export const SPLASH_HOLD_SELECTOR = "[data-splash-hold]";

// Runs inline before the first paint (see layout.tsx), so the splash is
// already covering the screen when the browser draws its first frame, and a
// page that doesn't want it never flashes it.
//
// Once per app start: sessionStorage lives as long as the tab / installed
// app / native WebView does, so a reload or the next page load in the same
// session goes straight to the page.
//
// The public marketing pages (landing, FAQ, legal) skip it in a normal
// browser tab: people arriving from search should see the content, not a
// logo. The installed app and the store apps always show it, wherever they
// start.
export const APP_SPLASH_SCRIPT = `try{var d=document.documentElement,p=location.pathname,app=/ComtorApp\\//.test(navigator.userAgent)||matchMedia('(display-mode: standalone)').matches||navigator.standalone===true,pub=p==='/'||p==='/faq'||p.indexOf('/legal')===0;if(!sessionStorage.getItem('${SPLASH_SEEN_KEY}')&&(app||!pub)){sessionStorage.setItem('${SPLASH_SEEN_KEY}','1');d.dataset.splash='on';}}catch(e){}`;
