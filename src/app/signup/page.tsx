import { redirect } from "next/navigation";
import { parseSignupRole } from "@/lib/signup-role";

// The account is created inside onboarding, after the payoff. This route
// stays so old links and the login page still land in the right place.
export default async function SignupPage(props: PageProps<"/signup">) {
  const role = parseSignupRole((await props.searchParams).role);
  redirect(role === "STARTUP" ? "/onboarding?role=brand" : role === "CREATOR" ? "/onboarding?role=creator" : "/onboarding");
}
