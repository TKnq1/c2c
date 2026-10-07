import { redirect } from "next/navigation";
import { parseSignupRole } from "@/lib/signup-role";
import { readUtm, utmQuery } from "@/lib/utm";

// The account is created inside onboarding, after the payoff. This route
// stays so old links and the login page still land in the right place.
export default async function SignupPage(props: PageProps<"/signup">) {
  const searchParams = await props.searchParams;
  const role = parseSignupRole(searchParams.role);
  const campaign = utmQuery(readUtm(searchParams));
  const side = role === "STARTUP" ? "role=brand" : role === "CREATOR" ? "role=creator" : "";
  const query = [side, campaign].filter(Boolean).join("&");
  redirect(query ? `/onboarding?${query}` : "/onboarding");
}
