
"use client"

import { useEffect } from "react";

export default function AuthProviderCallbackPage({ params, }: { params: { provider: string } }) {
  const queryString = window.location.search;

  useEffect(() => {
    const baseUrl = `/api/auth/${params.provider}/callback`; // Replace with your API endpoint
    const urlWithQuery = `${baseUrl}${queryString}`;

    fetch(urlWithQuery, {
      credentials: "include",
    }).catch((error) => {
      console.error(`Error performing callback: ${error}`);
    });
  }, []);

  return <div>Callback page: {params.provider}</div>;
}
