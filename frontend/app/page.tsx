'use client'

import { Colors, ArcElement, Chart as ChartJS, Legend, Tooltip } from 'chart.js';
import Link from 'next/link';
import { Doughnut } from 'react-chartjs-2';
import AddTransactionForm from './add-transaction-form';
import AddInvestmentForm from './add-investment-form';
import { useEffect, useState } from 'react';

ChartJS.register(Colors, ArcElement, Tooltip, Legend);

interface Investment {
  id: string
  type: string
  name: string
}

export default function Home() {
  const [investments, setInvestments] = useState<Investment[]>([]);

  useEffect(() => {
    fetchInvestments()
  }, []);

  const fetchInvestments = async () => {
    fetch(`http://localhost:8888/v1/investments`)
      .then((res) => res.json())
      .then((data) => {
        setInvestments(data);
      });
  }

  const data = {
    labels: ["Stocks", "Bitcoin"],
    datasets: [
      {
        data: [20_000, 4_900],
        borderWidth: 1,
      },
    ],
  };

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
        <AddTransactionForm />
        <br />
        <AddInvestmentForm onAdd={fetchInvestments}/>
        <br />
        <h1 className="text-xl font-bold mb-3">Investments</h1>
        {investments.length > 0 &&
          investments.map((investment) => (
            <div key={investment.id}>
              {JSON.stringify(investment)}
            </div>
          ))}
      </div>
    </main>
  );
}
