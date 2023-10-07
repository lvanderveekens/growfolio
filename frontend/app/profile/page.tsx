"use client"

import { api } from "@/app/axios";
import { Navbar } from "@/app/navbar";
import "chartjs-adapter-moment";
import { useEffect, useState } from "react";
import ClipLoader from "react-spinners/ClipLoader";
import { User } from "../page";

export default function ProfilePage() {

  const [user, setUser] = useState<User>();
  const [loading, setLoading] = useState<boolean>(true);

  const [successMessage, setSuccessMessage] = useState<string>();
  const [errorMessage, setErrorMessage] = useState<string>();

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    setSuccessMessage(undefined);
    setErrorMessage(undefined);
    // api.put(`/v1/settings`, settings).then((res) => {
    //   if (res.status === 200) {
    //     setSuccessMessage("Settings saved.");
    //   } else {
    //     setErrorMessage("Something went wrong.");
    //   }
    // });
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
          // <form onSubmit={handleSubmit}>
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

          //   <button className="border px-3 py-2" type="submit">
          //     Save
          //   </button>
          //   {successMessage && <div className="mt-4">{successMessage}</div>}
          //   {errorMessage && (
          //     <div className="mt-4 text-red-500">{errorMessage}</div>
          //   )}
          // </form>
        )}
      </div>
    </>
  );
}