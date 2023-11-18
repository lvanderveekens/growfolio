"use client"

import { api } from "@/app/axios";
import "chartjs-adapter-moment";
import { useEffect, useState } from "react";
import ClipLoader from "react-spinners/ClipLoader";
import { AccountType, User, getAccountTypeLabel } from "../overview-page";
import { createCheckoutSession, createPortalSession } from "../stripe/client";
import AppLayout from "../app-layout";
import { Button } from "../button";

export default function ProfilePage() {

  const [user, setUser] = useState<User>();
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchUser()]).finally(() =>
      setLoading(false)
    );
  }, []);

  const fetchUser = async () => {
    api.get("/user")
      .then((res) => {
        if (res.status === 200) {
          setUser(res.data);
        } 
      })
  };

  return (
    <AppLayout>
      <div className="container my-4">
        <h1 className="text-3xl sm:text-3xl font-bold mb-4">Profile</h1>
        {loading && (
          <div className="mb-4">
            <ClipLoader
              size={28}
              aria-label="Loading Spinner"
              data-testid="loader"
            />
          </div>
        )}
        {!loading && (
          <div className="w-full lg:w-[500px]">
            <div className="mb-4">
              <label>
                <div>Email</div>
                <input
                  type="text"
                  value={user?.email || ""}
                  disabled
                />
              </label>
            </div>
            <div className="mb-4">
              <label>
                <div>Account type</div>
                <input
                  type="text"
                  value={(user && getAccountTypeLabel(user.accountType)) || ""}
                  disabled
                />
              </label>
            </div>
            {user && user.accountType == AccountType.BASIC && (
              <div>
                <Button
                  className="w-full sm:w-auto"
                  variant="primary"
                  onClick={createCheckoutSession}
                >
                  Upgrade to Premium
                </Button>
              </div>
            )}
            {user && user.accountType == AccountType.PREMIUM && (
              <div>
                <Button
                  className="w-full sm:w-auto"
                  variant="primary"
                  onClick={createPortalSession}
                >
                  Manage subscription
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
}