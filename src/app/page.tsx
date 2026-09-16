import { redirect } from "next/navigation";

// Temporary stopgap — the real landing page is being built separately and
// will replace this file. Redirecting to /login means "/" is at least
// usable for a demo in the meantime instead of 404ing.
export default function Home() {
  redirect("/login");
}
