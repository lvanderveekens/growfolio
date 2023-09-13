
"use client"

import { useEffect } from "react";
import { useRouter } from 'next/navigation';

export default function LoginPage({ params, }: { params: { provider: string } }) {
  const queryString = window.location.search;
  const router = useRouter();

  return (
    <div>
      <span>Log in to Growfolio</span>
    </div>
  );
}
