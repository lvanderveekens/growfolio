'use client'

import { Colors, ArcElement, Chart as ChartJS, Legend, Tooltip } from 'chart.js';
import Link from 'next/link';
import { Doughnut } from 'react-chartjs-2';
import AddTransactionForm, { TransactionType } from './add-transaction-form';
import AddInvestmentForm from './add-investment-form';
import { useEffect, useState } from 'react';
import { InvestmentType } from './investment-type';
import UpdateInvestmentForm from './update-investment-form copy';

ChartJS.register(Colors, ArcElement, Tooltip, Legend);

export interface Investment {
  id: string
  type: InvestmentType
  name: string
}

export interface InvestmentUpdate {
  id: string
  date: string
  investmentId: string
  value: number
}

export interface Transaction {
  id: string
  date: string
  type: TransactionType
  investmentId: string
  amount: number
}

export default function Home() {
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [investmentUpdates, setInvestmentUpdates] = useState<InvestmentUpdate[]>([]);
  const [transactons, setTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    fetchInvestments()
    fetchInvestmentUpdates()
    fetchTransactions()
  }, []);

  const fetchInvestments = async () => {
    fetch(`http://localhost:8888/v1/investments`)
      .then((res) => res.json())
      .then((data) => {
        setInvestments(data);
      });
  }

  const fetchInvestmentUpdates = async () => {
    fetch(`http://localhost:8888/v1/investment-updates`)
      .then((res) => res.json())
      .then((data) => {
        setInvestmentUpdates(data);
      });
  }

  const fetchTransactions = async () => {
    fetch(`http://localhost:8888/v1/transactions`)
      .then((res) => res.json())
      .then((data) => {
        setTransactions(data);
      });
  }

  const findInvestmentById = (id: string) => {
    return investments.find((i) => i.id == id)
  }

  return (
    <main>
      <nav className="py-4 b-4">
        <div className="container mx-auto text-xl flex justify-between align-center">
          <div className="text-4xl font-bold self-center">
            <Link href="/">growfolio</Link>
          </div>
        </div>
      </nav>
      <div className="container mx-auto">
        <AddTransactionForm
          onAdd={fetchTransactions}
          investments={investments}
        />
        <br />
        <AddInvestmentForm onAdd={fetchInvestments} />
        <br />
        <UpdateInvestmentForm onAdd={fetchInvestmentUpdates} investments={investments} />
        <br />
        <h1 className="text-xl font-bold mb-3">Investments</h1>
        {investments.length > 0 &&
          investments.map((investment) => (
            <div key={investment.id}>
              {investment.name} ({investment.type})
            </div>
          ))}
        <br />
        <h1 className="text-xl font-bold mb-3">Transactions</h1>
        {transactons.length > 0 &&
          transactons.map((transaction) => (
            <div key={transaction.id}>
              {transaction.date} {transaction.type}{" "}
              {findInvestmentById(transaction.investmentId)?.name} €{" "}
              {transaction.amount / 100}
            </div>
          ))}
        <br />
        <h1 className="text-xl font-bold mb-3">Investment updates</h1>
        {investmentUpdates.length > 0 &&
          investmentUpdates.map((investmentUpdate) => (
            <div key={investmentUpdate.id}>
              {investmentUpdate.date}{" "}
              {findInvestmentById(investmentUpdate.investmentId)?.name} €{" "}
              {investmentUpdate.value / 100}
            </div>
          ))}
      </div>
    </main>
  );
}
