import { redirect } from "next/navigation";

/**
 * Root page — redirects to the dashboard.
 * In the future, this could be a landing page or login gate.
 */
export default function HomePage() {
  redirect("/home");
}
