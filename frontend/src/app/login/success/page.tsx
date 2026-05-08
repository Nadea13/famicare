"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";

function LoginSuccessHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const token = searchParams.get("token");

    if (token) {
      // 1. Save token to localStorage for authenticated requests
      localStorage.setItem("famicare_token", token);
      
      // 2. Briefly wait to show the "Success" state then redirect
      const timer = setTimeout(() => {
        router.push("/home");
      }, 1500);

      return () => clearTimeout(timer);
    } else {
      // If no token, something went wrong, go back to login
      router.push("/login");
    }
  }, [router, searchParams]);

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center">
      <div className="relative mb-8">
        {/* Animated Success Circle */}
        <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center animate-pulse">
           <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center">
             <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
             </svg>
           </div>
        </div>
        <div className="absolute -bottom-2 -right-2">
           <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
        </div>
      </div>
      
      <h2 className="text-2xl font-bold text-slate-900 mb-2">เข้าสู่ระบบสำเร็จ!</h2>
      <p className="text-slate-500 font-medium">กำลังเตรียมข้อมูลสุขภาพของคุณ...</p>
    </div>
  );
}

export default function LoginSuccessPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginSuccessHandler />
    </Suspense>
  );
}
