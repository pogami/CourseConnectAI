"use client";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { LoginForm } from "@/components/login-form";

function LoginPageContent() {
    const searchParams = useSearchParams();
    const initialState = searchParams.get('state') === 'signup' ? 'signup' : 'login';

    return (
        <div className="flex min-h-screen flex-col items-center justify-start bg-transparent p-8 pt-8 pb-16" suppressHydrationWarning>
            <div className="w-full max-w-md" suppressHydrationWarning>
                <LoginForm initialState={initialState} />
            </div>
        </div>
    );
}


export default function LoginPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <LoginPageContent />
        </Suspense>
    )
}
