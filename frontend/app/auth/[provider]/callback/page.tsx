
"use client"

import { useEffect } from "react";
import { useRouter } from 'next/navigation';

export default function AuthProviderCallbackPage({ params, }: { params: { provider: string } }) {
  const queryString = window.location.search;
  const router = useRouter();

  useEffect(() => {
    const baseUrl = `/api/v1/auth/${params.provider}/callback`; // Replace with your API endpoint
    const urlWithQuery = `${baseUrl}${queryString}`;

    fetch(urlWithQuery, {
      credentials: "include",
    })
      .catch((error) => {
        console.error(`Error performing callback: ${error}`);
      })
      .finally(() => {
        router.push("/")
      });
  }, []);

  return <div>Processing callback</div>;
}
