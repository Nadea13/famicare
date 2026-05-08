"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Root page — checks for authentication and redirects.
 */
export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("famicare_token");
    if (token) {
      router.push("/home");
    } else {
      router.push("/login");
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}
