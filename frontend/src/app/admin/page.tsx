"use client";

import { useRouter } from "next/navigation";
import { AdminView } from "@/components/admin/admin-view";

export default function AdminPage() {
  const router = useRouter();
  return (
    <AdminView
      onBackToSite={() => {
        router.push("/");
      }}
    />
  );
}
