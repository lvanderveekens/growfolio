"use client"

import { api } from "@/app/axios";
import Modal from "@/app/modal";
import { Investment } from "@/app/overview-page";
import { Settings } from "@/app/settings/settings";
import { capitalize, formatAmountInCentsAsCurrencyString } from "@/app/string";
import "chartjs-adapter-moment";
import { useEffect, useState } from "react";
import { FaXmark } from "react-icons/fa6";
import AddTransactionForm from "../../add-transaction-form";
import ImportTransactionsForm from "../../import-transactions-form";
import { Transaction } from "../../transaction";
import { InvestmentIsLockedMessage } from "../../investment-locked-message";
import AppLayout from "@/app/app-layout";
import { Button } from "@/app/button";

export default function InvestmentTransactionsPage({ params }: { params: { id: string } }) {
  const [investment, setInvestment] = useState<Investment>();

  const [loadingInvestment, setLoadingInvestment] = useState<boolean>(true)
  const [loadingInvestmentError, setLoadingInvestmentError] = useState<string>();
  
  const [loadingTransactions, setLoadingTransactions] = useState<boolean>(true)
  const [loadingTransactionsError, setLoadingTransactionsError] = useState<string>();

  const [transactions, setTransactions] = useState<Transaction[]>([])

  const [showAddTransactionModal, setShowAddTransactionModal] = useState<boolean>(false);
  const [showImportTransactionsModal, setShowImportTransactionsModal] = useState<boolean>(false);

  const [settings, setSettings] = useState<Settings>();

  useEffect(() => {
    fetchInvestment()
    fetchTransactions()
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

  const fetchTransactions = () => {
    api.get(`/transactions?investmentId=${params.id}`)
      .then((res) => setTransactions(res.data))
      .catch((error) => {
        console.error(`Error fetching transactions: ${error}`);
        setLoadingTransactionsError(error);
      })
      .finally(() => setLoadingTransactions(false));
  }

  const deleteTransaction = async (id: string) => {
    await api.delete(`/transactions/${id}`);
  }

  if (loadingInvestment || loadingTransactions) {
    return <p>Loading...</p>;
  }

  if (loadingInvestmentError) {
    return <p>Error: ${loadingInvestmentError}</p>;
  }

  if (loadingTransactionsError) {
    return <p>Error: ${loadingTransactionsError}</p>;
  }

  if (!investment) {
    return <p>Error: Investment not found.</p>;
  }

  return (
    <AppLayout>
      <div className="container my-4">
        <h1 className="text-3xl font-bold mb-4">
          Transactions: {investment.name}
        </h1>

        {investment.locked && (
          <InvestmentIsLockedMessage />
        )}

        {transactions.length === 0 && <div className="mb-4">No transactions found.</div>}
        {transactions.length > 0 && (
          <div className="overflow-x-auto mb-4">
            <table className="whitespace-nowrap w-full">
              <thead>
                <tr className="border">
                  <th className="border px-3 text-left">Date</th>
                  <th className="border px-3 text-left">Type</th>
                  <th className="border px-3 text-left">Amount</th>
                  <th className="border px-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((transaction) => {
                  return (
                    <tr key={transaction.id} className="border">
                      <td className="border px-3">{transaction.date}</td>
                      <td className="border px-3">
                        {capitalize(transaction.type)}
                      </td>
                      <td className="border px-3">
                        {settings && formatAmountInCentsAsCurrencyString(transaction.amount, settings.currency)}
                      </td>
                      <td className="border px-3">
                        <FaXmark
                          className="hover:cursor-pointer"
                          size={24}
                          color="red"
                          onClick={async () => {
                            await deleteTransaction(transaction.id);
                            fetchTransactions();
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
            onClick={() => setShowAddTransactionModal(true)}
            disabled={investment?.locked}
          >
            Add transaction
          </Button>
          {showAddTransactionModal && settings &&(
            <Modal
              title="Add transaction"
              onClose={() => setShowAddTransactionModal(false)}
            >
              <AddTransactionForm
                onAdd={() => {
                  setShowAddTransactionModal(false);
                  fetchTransactions();
                }}
                investmentId={params.id}
                currency={settings.currency}
              />
            </Modal>
          )}
          <Button
            className="w-full lg:w-auto"
            variant="secondary"
            type="submit"
            onClick={() => setShowImportTransactionsModal(true)}
            disabled={investment?.locked}
          >
            Import transactions
          </Button>
          {showImportTransactionsModal && (
            <Modal
              title="Import transactions"
              onClose={() => setShowImportTransactionsModal(false)}
            >
              <ImportTransactionsForm
                onImport={() => {
                  setShowImportTransactionsModal(false);
                  fetchTransactions();
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