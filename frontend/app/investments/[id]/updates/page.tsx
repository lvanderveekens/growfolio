"use client"

import Modal from "@/app/modal";
import { Investment, InvestmentUpdate } from "@/app/page";
import { formatAsEuroAmount } from "@/app/string";
import "chartjs-adapter-moment";
import { useEffect, useState } from "react";
import { FaXmark } from "react-icons/fa6";
import UpdateInvestmentForm from "../../update-investment-form";
import { Navbar } from "@/app/navbar";
import { api } from "@/app/axios";

export default function InvestmentUpdatesPage({ params }: { params: { id: string } }) {
  const [investment, setInvestment] = useState<Investment>();

  const [loadingInvestment, setLoadingInvestment] = useState<boolean>(true)
  const [loadingInvestmentError, setLoadingInvestmentError] = useState<string>();
  
  const [loadingUpdates, setLoadingUpdates] = useState<boolean>(true)
  const [loadingUpdatesError, setLoadingUpdatesError] = useState<string>();

  const [updates, setUpdates] = useState<InvestmentUpdate[]>([])

  const [showUpdateInvestmentModal, setShowUpdateInvestmentModal] = useState<boolean>(false);

  useEffect(() => {
    fetchInvestment()
    fetchUpdates()
  }, []);

  const fetchInvestment = () => {
    api.get(`/v1/investments/${params.id}`)
      .then((res) => setInvestment(res.data))
      .catch((error) => {
        console.error(`Error fetching investment: ${error}`);
        setLoadingInvestmentError(error)
      })
      .finally(() => setLoadingInvestment(false));
    }

  const fetchUpdates = () => {
    api.get(`/v1/investment-updates?investmentId=${params.id}`)
      .then((res) => setUpdates(res.data))
      .catch((error) => {
        console.error(`Error fetching updates: ${error}`);
        setLoadingUpdatesError(error)
      })
      .finally(() => setLoadingUpdates(false));
  }

  const deleteUpdate = async (id: string) => {
    await api.delete(`/v1/investment-updates/${id}`);
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

  return (
    <>
      <Navbar />
      <div className="p-8">
        <h1 className="text-3xl font-bold mb-8">Updates: {investment.name}</h1>
        {updates.length > 0 && (
          <div className="overflow-x-auto mb-4">
            <table className="whitespace-nowrap w-full">
              <thead>
                <tr className="border">
                  <th className="border px-3 text-left">Date</th>
                  <th className="border px-3 text-left">Value</th>
                  <th className="border px-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {updates.map((update) => {
                  return (
                    <tr key={update.id} className="border">
                      <td className="border px-3">{update.date}</td>
                      <td className="border px-3">
                        {formatAsEuroAmount(update.value)}
                      </td>
                      <td className="border px-3">
                        <FaXmark
                          className="hover:cursor-pointer"
                          size={24}
                          color="red"
                          onClick={async () => {
                            await deleteUpdate(update.id);
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
          <button
            className="border px-3 py-2"
            type="submit"
            onClick={() => setShowUpdateInvestmentModal(true)}
          >
            Add update
          </button>
          {showUpdateInvestmentModal && (
            <Modal
              title="Update investment"
              onClose={() => setShowUpdateInvestmentModal(false)}
            >
              <UpdateInvestmentForm
                onAdd={() => {
                  setShowUpdateInvestmentModal(false);
                  fetchUpdates();
                }}
                investmentId={params.id}
              />
            </Modal>
          )}
        </div>
      </div>
    </>
  );
}