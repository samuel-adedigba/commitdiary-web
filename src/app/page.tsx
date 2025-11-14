"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function HomePage() {
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((_e, session) =>
      setSession(session)
    );
    return () => listener.subscription.unsubscribe();
  }, []);

  const signIn = async (provider: "github" | "google") => {
    await supabase.auth.signInWithOAuth({ provider });
  };
  const signOut = async () => await supabase.auth.signOut();

  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-6 text-center">
      <h1 className="text-4xl font-bold">CommitDiary Dashboard</h1>
      {session ? (
        <>
          <p className="text-gray-600">Welcome, {session.user.email}</p>
          <button
            onClick={signOut}
            className="px-4 py-2 bg-red-600 text-white rounded"
          >
            Sign Out
          </button>
        </>
      ) : (
        <div className="flex gap-4">
          <button
            onClick={() => signIn("github")}
            className="px-4 py-2 bg-gray-800 text-white rounded"
          >
            Sign in with GitHub
          </button>
          <button
            onClick={() => signIn("google")}
            className="px-4 py-2 bg-blue-600 text-white rounded"
          >
            Sign in with Google
          </button>
        </div>
      )}
    </main>
  );
}
