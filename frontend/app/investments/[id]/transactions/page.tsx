"use client"

import Modal from "@/app/modal";
import { Investment, InvestmentUpdate } from "@/app/page";
import { capitalize, formatAmountInCentsAsCurrencyString } from "@/app/string";
import "chartjs-adapter-moment";
import { useEffect, useState } from "react";
import { FaXmark } from "react-icons/fa6";
import { Transaction } from "../../transaction";
import AddTransactionForm from "../../add-transaction-form";
import { Navbar } from "@/app/navbar";
import { api } from "@/app/axios";
import ImportTransactionsForm from "../../import-transactions-form";

export default function InvestmentTransactionsPage({ params }: { params: { id: string } }) {
  const [investment, setInvestment] = useState<Investment>();

  const [loadingInvestment, setLoadingInvestment] = useState<boolean>(true)
  const [loadingInvestmentError, setLoadingInvestmentError] = useState<string>();
  
  const [loadingTransactions, setLoadingTransactions] = useState<boolean>(true)
  const [loadingTransactionsError, setLoadingTransactionsError] = useState<string>();

  const [transactions, setTransactions] = useState<Transaction[]>([])

  const [showAddTransactionModal, setShowAddTransactionModal] = useState<boolean>(false);
  const [showImportTransactionsModal, setShowImportTransactionsModal] = useState<boolean>(false);

  useEffect(() => {
    fetchInvestment()
    fetchTransactions()
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

  const fetchTransactions = () => {
    api.get(`/v1/transactions?investmentId=${params.id}`)
      .then((res) => setTransactions(res.data))
      .catch((error) => {
        console.error(`Error fetching transactions: ${error}`);
        setLoadingTransactionsError(error);
      })
      .finally(() => setLoadingTransactions(false));
  }

  const deleteTransaction = async (id: string) => {
    await api.delete(`/v1/transactions/${id}`);
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

  return (
    <>
      <Navbar />
      <div className="p-4 mb-4">
        <h1 className="text-2xl sm:text-3xl font-bold mb-4">
          Transactions: {investment.name}
        </h1>
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
                        {formatAmountInCentsAsCurrencyString(transaction.amount)}
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
          <button
            className="border w-full mb-2 px-3 py-2 mr-4"
            type="submit"
            onClick={() => setShowAddTransactionModal(true)}
          >
            Add transaction
          </button>
          {showAddTransactionModal && (
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
              />
            </Modal>
          )}
          <button
            className="border w-full px-3 py-2"
            type="submit"
            onClick={() => setShowImportTransactionsModal(true)}
          >
            Import transactions
          </button>
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
    </>
  );
}