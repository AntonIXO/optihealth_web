"use client";
import dynamic from "next/dynamic";

const ClientAuth = dynamic(() => import("./client-auth"), { ssr: false });

export default function LoginPage() {
  return <ClientAuth />;
}