"use client";

import { useEffect, useState } from "react";

import "chartjs-adapter-moment";
import PortfolioPage, { User } from "./portfolio-page";
import axios from "axios";
import LandingPage from "./landing-page";

export default function Home() {
  const [loading, setLoading] = useState(true); 
  const [user, setUser] = useState<User>();

  useEffect(() => {
    Promise.all([fetchUser()]).finally(() => setLoading(false));
  }, []);

  const fetchUser = () => {
    return axios
      .get("/api/user")
      .then((res) => {
        setUser(res.data)
      })
      .catch(() => {
        // ignore
      });
  };

  if (loading) {
    return
  }

  if (user) {
    return <PortfolioPage />
  } else {
    return <LandingPage />
  }
}
