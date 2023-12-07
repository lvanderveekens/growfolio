"use client"

import AppLayout from "@/app/app-layout";
import { api } from "@/app/axios";
import Modal from "@/app/modal";
import { Investment, InvestmentUpdate } from "@/app/overview-page";
import { Settings } from "@/app/settings/settings";
import { formatAmountInCentsAsCurrencyString } from "@/app/string";
import "chartjs-adapter-moment";
import { useEffect, useState } from "react";
import { FaChevronLeft, FaRegTrashCan } from "react-icons/fa6";
import AddUpdateForm from "../../add-update-form";
import ImportUpdatesForm from "../../import-updates-form";
import { InvestmentIsLockedMessage } from "../../investment-locked-message";
import { Button } from "@/app/button";
import Link from "next/link";

export default function InvestmentUpdatesPage({ params }: { params: { id: string } }) {
  const [investment, setInvestment] = useState<Investment>();

  const [loadingInvestment, setLoadingInvestment] = useState<boolean>(true)
  const [loadingInvestmentError, setLoadingInvestmentError] = useState<string>();
  
  const [loadingUpdates, setLoadingUpdates] = useState<boolean>(true)
  const [loadingUpdatesError, setLoadingUpdatesError] = useState<string>();

  const [investmentUpdates, setInvestmentUpdates] = useState<InvestmentUpdate[]>([])

  const [showUpdateInvestmentModal, setShowUpdateInvestmentModal] = useState<boolean>(false);
  const [showImportUpdatesModal, setShowImportUpdatesModal] = useState<boolean>(false);

  const [selectedUpdate, setSelectedUpdate] = useState<InvestmentUpdate>();
  const [showDeleteUpdateModal, setShowDeleteUpdateModal] = useState<boolean>(false);

  const [settings, setSettings] = useState<Settings>();

  useEffect(() => {
    fetchInvestment()
    fetchInvestmentUpdates()
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

  const fetchInvestmentUpdates = () => {
    api
      .get(`/investment-updates?investmentId=${params.id}`)
      .then((res) => {
        const updates = res.data as InvestmentUpdate[]
        updates.sort((a, b) => (new Date(b.date).getTime()) - (new Date(a.date).getTime()));
        setInvestmentUpdates(updates);
      })
      .catch((error) => {
        console.error(`Error fetching updates: ${error}`);
        setLoadingUpdatesError(error);
      })
      .finally(() => {
        setLoadingUpdates(false);
      });
  }

  const deleteUpdate = (id: string) => {
    api
      .delete(`/investment-updates/${id}`)
      .then((res) => {
        if (res.status == 204) {
          fetchInvestmentUpdates();
          closeDeleteUpdateModal();
        }
      })
      .catch((err) => console.log(err));
  }

  const openDeleteUpdateModal = (update: InvestmentUpdate) => {
    setSelectedUpdate(update);
    setShowDeleteUpdateModal(true);
  };

  const closeDeleteUpdateModal = () => {
    setShowDeleteUpdateModal(false);
    setSelectedUpdate(undefined);
  };

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
        <Link
          className="mb-4 inline-block"
          href={`/investments/${investment.id}`}
        >
          <div className="flex items-center">
            <FaChevronLeft className="inline" />
            Back to {investment.name}
          </div>
        </Link>

        <h1 className="text-3xl sm:text-3xl font-bold mb-4">
          {investment.name} updates
        </h1>

        {investment.locked && <InvestmentIsLockedMessage />}

        {investmentUpdates.length === 0 && <div className="mb-4">No updates found.</div>}
        {investmentUpdates.length > 0 && (
          <div className="overflow-x-auto mb-4">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Deposit</th>
                  <th>Withdrawal</th>
                  <th>Value</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {investmentUpdates.map((update) => {
                  return (
                    <tr key={update.id}>
                      <td>{update.date}</td>
                      <td>
                        {settings &&
                          formatAmountInCentsAsCurrencyString(
                            update.deposit,
                            settings.currency
                          )}
                      </td>
                      <td>
                        {settings &&
                          formatAmountInCentsAsCurrencyString(
                            update.withdrawal,
                            settings.currency
                          )}
                      </td>
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
                          onClick={() => openDeleteUpdateModal(update)}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {showDeleteUpdateModal && selectedUpdate && (
              <Modal title="Delete update" onClose={closeDeleteUpdateModal}>
                Are you sure?
                <div className="mt-4 flex gap-4 justify-between lg:justify-end">
                  <Button
                    className="w-full lg:w-auto"
                    variant="secondary"
                    onClick={closeDeleteUpdateModal}
                  >
                    Cancel
                  </Button>
                  <Button
                    className="w-full lg:w-auto"
                    variant="danger"
                    onClick={() => deleteUpdate(selectedUpdate.id)}
                  >
                    Delete
                  </Button>
                </div>
              </Modal>
            )}
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
                  fetchInvestmentUpdates();
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
                  fetchInvestmentUpdates();
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