
"use client"

import { useEffect } from "react";
import { useRouter } from 'next/navigation';
import { api } from "@/app/axios";
import ClipLoader from "react-spinners/ClipLoader";

export default function AuthProviderCallbackPage({ params, }: { params: { provider: string } }) {
  const queryString = window.location.search;
  console.log("queryString=" + queryString)
  const router = useRouter();

  useEffect(() => {
    const baseUrl = `/auth/${params.provider}/callback`;
    const urlWithQuery = `${baseUrl}${queryString}`;

    api.get(urlWithQuery)
      .catch((error) => {
        console.error(`Error performing callback: ${error}`);
      })
      .finally(() => {
        router.push("/")
      });
  }, []);

  return (
    <div className="w-screen h-screen flex items-center justify-center">
      <ClipLoader size={64} aria-label="Loading Spinner" data-testid="loader" />
    </div>
  );
}
