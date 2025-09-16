"use client";

import { signOut } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";

export default function Signout() {
  const router = useRouter();
  const { lang } = useParams();

  const handleSignout = async () => {
    try {
      await signOut({ redirect: false });
      router.push(`/${lang}/`); // Redirect to home after signout
    } catch (error) {
      console.error("Signout failed:", error);
    }
  };

  return (
    <button
      onClick={handleSignout}
    >
      Sign Out
    </button>
  );
}
