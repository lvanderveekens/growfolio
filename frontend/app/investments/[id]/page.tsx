"use client"

import { Investment } from "@/app/page";
import { Transaction } from "@/app/investments/transaction";
import { useEffect, useState } from "react";

export default function InvestmentPage({ params }: { params: { id: string } }) {
  const [investment, setInvestment] = useState<Investment>();
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string>()

  const [transactions, setTransactions] = useState<Transaction[]>([])

  useEffect(() => {
    fetchInvestment()
    fetchTransactions()
  }, []);

  const fetchInvestment = () => {
    fetch(`http://localhost:8888/v1/investments/${params.id}`)
      .then((res) => res.json())
      .then((data) => setInvestment(data))
      .catch((error) => {
        console.error(`Error fetching investment: ${error}`);
        setError(error)
      })
      .finally(() => setLoading(false));
    }

  const fetchTransactions = () => {
    fetch(`http://localhost:8888/v1/transactions?investmentId=${params.id}`)
      .then((res) => res.json())
      .then((data) => setTransactions(data));
  }

  return (
    <div className="container mx-auto">
      {loading && <p>Loading...</p>}
      {error && <p>Error: ${error}</p>}
      {investment && (
        <>
          <div className="mb-8">
            <h1 className="text-2xl font-bold mb-4">{investment.name}</h1>
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-bold mb-4">Transactions</h1>
            {transactions.length > 0 && (
              <div>{JSON.stringify(transactions)}</div>
            )}
          </div>

          <div className="">
            <h1 className="text-2xl font-bold mb-4">Updates</h1>
          </div>
        </>
      )}
    </div>
  );
}