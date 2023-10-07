
"use client"

import { useEffect } from "react";
import { useRouter } from 'next/navigation';
import { api } from "@/app/axios";

export default function AuthProviderCallbackPage({ params, }: { params: { provider: string } }) {
  const queryString = window.location.search;
  console.log("queryString=" + queryString)
  const router = useRouter();

  useEffect(() => {
    const baseUrl = `/v1/auth/${params.provider}/callback`;
    const urlWithQuery = `${baseUrl}${queryString}`;

    api.get(urlWithQuery)
      .catch((error) => {
        console.error(`Error performing callback: ${error}`);
      })
      .finally(() => {
        router.push("/")
      });
  }, []);

  return <div>Processing callback</div>;
}
