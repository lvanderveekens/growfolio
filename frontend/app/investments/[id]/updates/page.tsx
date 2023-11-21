"use client"

import AppLayout from "@/app/app-layout";
import { api } from "@/app/axios";
import Modal from "@/app/modal";
import { Investment, InvestmentUpdate } from "@/app/overview-page";
import { Settings } from "@/app/settings/settings";
import { formatAmountInCentsAsCurrencyString } from "@/app/string";
import "chartjs-adapter-moment";
import { useEffect, useState } from "react";
import { FaRegTrashCan } from "react-icons/fa6";
import AddUpdateForm from "../../add-update-form";
import ImportUpdatesForm from "../../import-updates-form";
import { InvestmentIsLockedMessage } from "../../investment-locked-message";
import { Button } from "@/app/button";

export default function InvestmentUpdatesPage({ params }: { params: { id: string } }) {
  const [investment, setInvestment] = useState<Investment>();

  const [loadingInvestment, setLoadingInvestment] = useState<boolean>(true)
  const [loadingInvestmentError, setLoadingInvestmentError] = useState<string>();
  
  const [loadingUpdates, setLoadingUpdates] = useState<boolean>(true)
  const [loadingUpdatesError, setLoadingUpdatesError] = useState<string>();

  const [updates, setUpdates] = useState<InvestmentUpdate[]>([])

  const [showUpdateInvestmentModal, setShowUpdateInvestmentModal] = useState<boolean>(false);
  const [showImportUpdatesModal, setShowImportUpdatesModal] = useState<boolean>(false);

  const [settings, setSettings] = useState<Settings>();

  useEffect(() => {
    fetchInvestment()
    fetchUpdates()
    fetchSettings()
  }, []);

  const fetchSettings = async () => {
    api.get(`/settings`).then((res) => {
      setSettings(res.data);
    });
  };

  const fetchInvestment = () => {
    api.get(`/investments/${params.id}`)
      .then((res) => setInvestment(res.data))
      .catch((error) => {
        console.error(`Error fetching investment: ${error}`);
        setLoadingInvestmentError(error)
      })
      .finally(() => setLoadingInvestment(false));
    }

  const fetchUpdates = () => {
    api.get(`/investment-updates?investmentId=${params.id}`)
      .then((res) => setUpdates(res.data))
      .catch((error) => {
        console.error(`Error fetching updates: ${error}`);
        setLoadingUpdatesError(error)
      })
      .finally(() => setLoadingUpdates(false));
  }

  const deleteUpdate = async (id: string) => {
    await api.delete(`/investment-updates/${id}`);
  }

  if (loadingInvestment || loadingUpdates) {
    return <p>Loading...</p>;
  }

  if (loadingInvestmentError) {
    return <p>Error: ${loadingInvestmentError}</p>;
  }

  if (loadingUpdatesError) {
    return <p>Error: ${loadingUpdatesError}</p>;
  }

  if (!investment) {
    return <p>Error: Investment not found.</p>;
  }

  return (
    <AppLayout>
      <div className="container my-4">
        <h1 className="text-3xl sm:text-3xl font-bold mb-4">
          Updates: {investment.name}
        </h1>

        {investment.locked && (
          <InvestmentIsLockedMessage />
        )}

        {updates.length === 0 && <div className="mb-4">No updates found.</div>}
        {updates.length > 0 && (
          <div className="overflow-x-auto mb-4">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Value</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {updates.map((update) => {
                  return (
                    <tr key={update.id}>
                      <td>{update.date}</td>
                      <td>
                        {settings &&
                          formatAmountInCentsAsCurrencyString(
                            update.value,
                            settings.currency
                          )}
                      </td>
                      <td>
                        <FaRegTrashCan
                          className="hover:cursor-pointer text-red-500 hover:text-red-700"
                          size={24}
                          onClick={async () => {
                            await deleteUpdate(update.id!!);
                            fetchUpdates();
                          }}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div>
          <Button
            className="w-full lg:w-auto mb-2 mr-4"
            variant="secondary"
            type="submit"
            onClick={() => setShowUpdateInvestmentModal(true)}
            disabled={investment.locked}
          >
            Add update
          </Button>
          {showUpdateInvestmentModal && settings && (
            <Modal
              title="Add update"
              onClose={() => setShowUpdateInvestmentModal(false)}
            >
              <AddUpdateForm
                onAdd={() => {
                  setShowUpdateInvestmentModal(false);
                  fetchUpdates();
                }}
                investmentId={params.id}
                currency={settings.currency}
              />
            </Modal>
          )}
          <Button
            className="w-full lg:w-auto mr-4"
            variant="secondary"
            type="submit"
            onClick={() => setShowImportUpdatesModal(true)}
            disabled={investment.locked}
          >
            Import updates
          </Button>
          {showImportUpdatesModal && (
            <Modal
              title="Import updates"
              onClose={() => setShowImportUpdatesModal(false)}
            >
              <ImportUpdatesForm
                onImport={() => {
                  setShowImportUpdatesModal(false);
                  fetchUpdates();
                }}
                investmentId={params.id}
              />
            </Modal>
          )}
        </div>
      </div>
    </AppLayout>
  );
}