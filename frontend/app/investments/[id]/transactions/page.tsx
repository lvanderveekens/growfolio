"use client"

import Modal from "@/app/modal";
import { Investment, InvestmentUpdate } from "@/app/page";
import { capitalize, formatAsEuroAmount } from "@/app/string";
import "chartjs-adapter-moment";
import { useEffect, useState } from "react";
import { FaXmark } from "react-icons/fa6";
import UpdateInvestmentForm from "../../update-investment-form";
import { Transaction } from "../../transaction";
import AddTransactionForm from "../../add-transaction-form";

export default function InvestmentTransactionsPage({ params }: { params: { id: string } }) {
  const [investment, setInvestment] = useState<Investment>();

  const [loadingInvestment, setLoadingInvestment] = useState<boolean>(true)
  const [loadingInvestmentError, setLoadingInvestmentError] = useState<string>();
  
  const [loadingTransactions, setLoadingTransactions] = useState<boolean>(true)
  const [loadingTransactionsError, setLoadingTransactionsError] = useState<string>();

  const [transactions, setTransactions] = useState<Transaction[]>([])

  const [showAddTransactionModal, setShowAddTransactionModal] = useState<boolean>(false);

  useEffect(() => {
    fetchInvestment()
    fetchTransactions()
  }, []);

  const fetchInvestment = () => {
    fetch(`/api/v1/investments/${params.id}`)
      .then((res) => res.json())
      .then((data) => setInvestment(data))
      .catch((error) => {
        console.error(`Error fetching investment: ${error}`);
        setLoadingInvestmentError(error)
      })
      .finally(() => setLoadingInvestment(false));
    }

  const fetchTransactions = () => {
    fetch(
      `/api/v1/transactions?investmentId=${params.id}`
    )
      .then((res) => res.json())
      .then((data) => setTransactions(data))
      .catch((error) => {
        console.error(`Error fetching transactions: ${error}`);
        setLoadingTransactionsError(error)
      })
      .finally(() => setLoadingTransactions(false));
  }

  const deleteTransaction = async (id: string) => {
    await fetch(`/api/v1/transactions/${id}`, {
      method: "DELETE",
    });
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
    <div className="mb-8">
      <h1 className="text-3xl font-bold mb-8">Transactions: {investment.name}</h1>
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
                      {formatAsEuroAmount(transaction.amount)}
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
          className="border px-3 py-2"
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
      </div>
    </div>
  );
}