// Runs before every `cap copy` / `cap sync` (the capacitor:copy:before hook
// in package.json). Bakes the configured server URL into the app's offline
// page (capacitor/www/index.html), whose "Try again" has to load the live
// site, not reload the local page it's on.
import { writeFileSync } from "node:fs";
import { join } from "node:path";

const config = JSON.parse(process.env.CAPACITOR_CONFIG ?? "{}");
const webDir = process.env.CAPACITOR_WEB_DIR ?? "capacitor/www";
const serverUrl = config.server?.url ?? "";

writeFileSync(join(webDir, "app-config.js"), `window.COMTOR_SERVER_URL = ${JSON.stringify(serverUrl)};\n`);
