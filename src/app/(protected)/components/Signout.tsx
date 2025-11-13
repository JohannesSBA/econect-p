"use client";

import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function Signout() {
  const router = useRouter();

  const handleSignout = async () => {
    try {
      await signOut({ redirect: false });
      router.push("/");
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
