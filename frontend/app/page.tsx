"use client";

import { useRouter } from "next/navigation";
import { Slide11LandingPage } from "@/components/Slide11LandingPage";
import { useAuth, getDashboardPathForRole } from "@/context/AuthContext";
import { Navbar } from "@/components/Navbar";

export default function HomePage() {
  const router = useRouter();
  const { user } = useAuth();

  const openLogin = () => router.push("/login");

  const openRoleDemo = (roleKey: string) => {
    const role =
      roleKey === "professor_hod"
        ? "faculty"
        : roleKey === "chancellor_dean"
          ? "admin"
          : roleKey;
    router.push(`/login?demo=${role}`);
  };

  const openConsole = () => {
    if (user) {
      router.push(getDashboardPathForRole(user.role));
    } else {
      openLogin();
    }
  };

  return (
    <>
      <Navbar />
      <Slide11LandingPage
        onLogin={openLogin}
        onDemo={openLogin}
        onDemoRole={openRoleDemo}
        user={user}
        onBackToConsole={openConsole}
      />
    </>
  );
}
