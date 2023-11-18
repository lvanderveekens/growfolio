"use client"

import { api } from "@/app/axios";
import "chartjs-adapter-moment";
import { useEffect, useState } from "react";
import ClipLoader from "react-spinners/ClipLoader";
import AppLayout from "../app-layout";
import Dropdown from "../dropdown";
import { Currency, Settings, labelsByCurrency } from "./settings";
import { Button } from "../button";

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings>();
  const [loading, setLoading] = useState<boolean>(true);

  const [successMessage, setSuccessMessage] = useState<string>();
  const [errorMessage, setErrorMessage] = useState<string>();

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchSettings()]).finally(() =>
      setLoading(false)
    );
  }, []);

  const fetchSettings = async () => {
    api
      .get(`/settings`)
      .then((res) => setSettings(res.data))
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage(undefined);
    setErrorMessage(undefined);
    api.put(`/settings`, settings).then((res) => {
      if (res.status === 200) {
        setSuccessMessage("Settings saved.");
      } else {
        setErrorMessage("Something went wrong.");
      }
    });
  };

  const setCurrency = (currency: Currency) => {
    setSettings({...settings, currency: currency})
  }

  return (
    <AppLayout>
      <div className="container my-4">
        <h1 className="text-3xl sm:text-3xl font-bold mb-4">Settings</h1>
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
          <form className="w-full lg:w-[400px]" onSubmit={handleSubmit}>
            <div className="mb-4">
              <label>Currency</label>
              <div>
                <Dropdown
                  selected={
                    settings && {
                      label: labelsByCurrency[settings.currency],
                      value: settings.currency,
                    }
                  }
                  onChange={(option) => setCurrency(option.value)}
                  options={Object.values(Currency).map((currency) => ({
                    label: labelsByCurrency[currency],
                    value: currency,
                  }))}
                />
              </div>
            </div>

            <Button variant="primary" type="submit">
              Save
            </Button>
            {successMessage && <div className="mt-4">{successMessage}</div>}
            {errorMessage && (
              <div className="mt-4 text-red-500">{errorMessage}</div>
            )}
          </form>
        )}
      </div>
    </AppLayout>
  );
}