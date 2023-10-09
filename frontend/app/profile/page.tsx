"use client"

import { api } from "@/app/axios";
import { Navbar } from "@/app/navbar";
import "chartjs-adapter-moment";
import { useEffect, useState } from "react";
import ClipLoader from "react-spinners/ClipLoader";
import { User, getAccountTypeLabel } from "../page";

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
    api.get("/v1/user")
      .then((res) => {
        if (res.status === 200) {
          setUser(res.data);
        } 
      })
  };

  return (
    <>
      <Navbar />
      <div className="p-4">
        <h1 className="text-2xl sm:text-3xl font-bold mb-4">Profile</h1>
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
          <>
            <div className="mb-4">
              <label>
                <div>Email</div>
                <input
                  className="border w-full"
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
                  className="border w-full"
                  type="text"
                  value={user && getAccountTypeLabel(user.accountType) || ""}
                  disabled
                />
              </label>
            </div>
          </>
        )}
      </div>
    </>
  );
}