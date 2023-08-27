
"use client"

import { useEffect } from "react";

export default function AuthProviderPage({ params, }: { params: { provider: string } }) {
  const queryString = window.location.search;

  useEffect(() => {
    const baseUrl = `/api/auth/${params.provider}`; // Replace with your API endpoint
    const urlWithQuery = `${baseUrl}${queryString}`;

    fetch(urlWithQuery, { })
      .then((res) => {
        console.log("aap");
        if (res.redirected) {
          console.log("banaan");
          window.location.href = res.url;
        }
      })
      .catch((error) => {
        console.error(`Error performing callback: ${error}`);
      });
  }, []);

  return <div>Callback page: {params.provider}</div>;
}
