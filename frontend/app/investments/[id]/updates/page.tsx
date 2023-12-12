"use client"

import AppLayout from "@/app/app-layout";
import { api } from "@/app/axios";
import Modal from "@/app/modal";
import { Investment, InvestmentUpdate } from "@/app/portfolio-page";
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

  const exportUpdates = () => {
    api
      .get(`/investments/${params.id}/updates/csv`)
      .then((res) => {
        const blob = new Blob([res.data], { type: res.headers['content-type'] });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;

        const contentDisposition = res.headers['content-disposition'];
        let filename = 'export.csv'; // Default filename
        if (contentDisposition) {
          const match = contentDisposition.match(/filename="(.+?)"/);
          if (match) {
            filename = match[1];
          }
        }

        link.download = filename;
        link.click();
        window.URL.revokeObjectURL(url);
      })
      .catch((error) => {
        console.error(`Error exporting updates: ${error}`);
        // setLoadingUpdatesError(error);
      })
      .finally(() => {
        // setLoadingUpdates(false);
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
        <Link className="mb-4 inline-block hover:underline underline-offset-4" href={`/investments/${investment.id}`}>
          <div className="flex items-center">
            <FaChevronLeft className="inline" />
            Back to {investment.name}
          </div>
        </Link>

        <h1 className="text-3xl sm:text-3xl font-bold mb-4">{investment.name} updates</h1>

        {investment.locked && <InvestmentIsLockedMessage />}

        <div className="bg-white overflow-x-auto">
          <div className="border border-b-0 p-4 lg:flex lg:gap-4 lg:justify-end">
            <Button
              className="w-full lg:w-auto mb-4 lg:mb-0"
              variant="secondary"
              type="submit"
              onClick={exportUpdates}
              disabled={investment.locked}
            >
              Export
            </Button>
            <Button
              className="w-full lg:w-auto mb-4 lg:mb-0"
              variant="secondary"
              type="submit"
              onClick={() => setShowImportUpdatesModal(true)}
              disabled={investment.locked}
            >
              Import
            </Button>
            {showImportUpdatesModal && (
              <Modal title="Import updates" onClose={() => setShowImportUpdatesModal(false)}>
                <ImportUpdatesForm
                  onImport={() => {
                    setShowImportUpdatesModal(false);
                    fetchInvestmentUpdates();
                  }}
                  investmentId={params.id}
                />
              </Modal>
            )}
            <Button
              className="w-full lg:w-auto"
              variant="primary"
              type="submit"
              onClick={() => setShowUpdateInvestmentModal(true)}
              disabled={investment.locked}
            >
              Add update
            </Button>
            {showUpdateInvestmentModal && settings && (
              <Modal title="Add update" onClose={() => setShowUpdateInvestmentModal(false)}>
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
          </div>

          <div className="border-x w-full overflow-x-auto">
            <table className="border-collapse">
              <thead>
                <tr className="">
                  <th>Date</th>
                  <th>Deposit</th>
                  <th>Withdrawal</th>
                  <th>Cost</th>
                  <th>Value</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {investmentUpdates.map((update, index) => {
                  return (
                    <tr key={update.id} className={`${index % 2 === 0 ? "bg-gray-50" : "bg-white"}`}>
                      <td>{update.date}</td>
                      <td>{settings && formatAmountInCentsAsCurrencyString(update.deposit, settings.currency)}</td>
                      <td>{settings && formatAmountInCentsAsCurrencyString(update.withdrawal, settings.currency)}</td>
                      <td>{settings && formatAmountInCentsAsCurrencyString(update.cost, settings.currency)}</td>
                      <td>{settings && formatAmountInCentsAsCurrencyString(update.value, settings.currency)}</td>
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
          </div>
          {investmentUpdates.length === 0 && (
            <div className="border border-t-0 p-4 flex justify-center items-center h-[300px]">
              <div className="text-center">
                <div className="text-2xl font-bold mb-4">No updates added yet</div>
                <div>Click on 'Add update' to get started.</div>
              </div>
            </div>
          )}
          {showDeleteUpdateModal && selectedUpdate && (
            <Modal title="Delete update" onClose={closeDeleteUpdateModal}>
              Are you sure?
              <div className="mt-4 flex gap-4 justify-between lg:justify-end">
                <Button className="w-full lg:w-auto" variant="secondary" onClick={closeDeleteUpdateModal}>
                  Cancel
                </Button>
                <Button className="w-full lg:w-auto" variant="danger" onClick={() => deleteUpdate(selectedUpdate.id)}>
                  Delete
                </Button>
              </div>
            </Modal>
          )}
        </div>
      </div>
    </AppLayout>
  );
}