"use client"

import { api } from "@/app/axios";
import { Navbar } from "@/app/navbar";
import "chartjs-adapter-moment";
import { useEffect, useState } from "react";
import { Currency, Settings } from "./settings";
import ClipLoader from "react-spinners/ClipLoader";

export default function SettingsPage() {

  const [settings, setSettings] = useState<Settings>();
  const [loading, setLoading] = useState<boolean>(true);

  const [successMessage, setSuccessMessage] = useState<string>();
  const [errorMessage, setErrorMessage] = useState<string>();

  useEffect(() => {
    fetchSettings()
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    api.get(`/v1/settings`)
    .then((res) => setSettings(res.data))
    .finally(() => setLoading(false));
  };

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      setSuccessMessage(undefined)
      setErrorMessage(undefined)
      api
        .put(`/v1/settings`, settings)
        .then((res) => {
          if (res.status === 200) {
            setSuccessMessage("Settings saved.") 
          } else {
            setErrorMessage("Something went wrong.")
          }
        })
    };

  const setCurrency = (currency: Currency) => {
    setSettings({...settings, currency: currency})
  }

  return (
    <>
      <Navbar />
      <div className="p-4">
        <h1 className="text-2xl sm:text-3xl font-bold mb-4">Settings</h1>

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
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label>
                <div>Currency</div>
                <select
                  className="border w-full"
                  value={settings?.currency ?? ""}
                  onChange={(e) => setCurrency(e.target.value as Currency)}
                  required
                >
                  <option value="" disabled>
                    Select currency
                  </option>
                  {Object.entries(Currency).map(([key, value]) => (
                    <option key={key} value={key}>
                      {value}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <button className="border px-3 py-2" type="submit">
              Save
            </button>
            {successMessage && (
              <div className="mt-4">
                {successMessage}
              </div>
            )}
            {errorMessage && (
              <div className="mt-4 text-red-500">
                {errorMessage}
              </div>
            )}
          </form>
        )}
      </div>
    </>
  );
}