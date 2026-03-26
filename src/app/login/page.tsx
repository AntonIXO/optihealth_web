"use client";

import dynamic from "next/dynamic";

const FeaturesShowcasePage = dynamic(
  () => import("@/components/landing/features-showcase-page"),
  { ssr: false },
);

export default function LoginPage() {
  return <FeaturesShowcasePage />;
}
