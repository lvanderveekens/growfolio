"use client"

import AppLayout from "@/app/app-layout";
import { api } from "@/app/axios";
import { Button } from "@/app/button";
import Modal from "@/app/modal";
import { Investment } from "@/app/overview-page";
import { Settings } from "@/app/settings/settings";
import { capitalize, formatAmountInCentsAsCurrencyString } from "@/app/string";
import "chartjs-adapter-moment";
import { useEffect, useState } from "react";
import { FaRegTrashCan } from "react-icons/fa6";
import AddTransactionForm from "../../add-transaction-form";
import ImportTransactionsForm from "../../import-transactions-form";
import { InvestmentIsLockedMessage } from "../../investment-locked-message";
import { Transaction } from "../../transaction";

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
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Amount</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((transaction) => {
                  return (
                    <tr key={transaction.id} className="border">
                      <td>{transaction.date}</td>
                      <td>
                        {capitalize(transaction.type)}
                      </td>
                      <td>
                        {settings && formatAmountInCentsAsCurrencyString(transaction.amount, settings.currency)}
                      </td>
                      <td>
                        <FaRegTrashCan
                          className="hover:cursor-pointer text-red-500 hover:text-red-700"
                          size={24}
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