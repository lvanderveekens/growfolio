'use client'

import Link from 'next/link';
import { useEffect, useState } from 'react';
import AddInvestmentForm from './add-investment-form';
import AddTransactionForm, { TransactionType } from './add-transaction-form';
import { InvestmentType } from './investment-type';
import UpdateInvestmentForm from './update-investment-form';

import {
  Chart as ChartJS,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  TimeScale,
  Title,
  Tooltip
} from 'chart.js';
import 'chartjs-adapter-moment';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  Tooltip, 
  Legend,
  TimeScale, //Register timescale instead of category for X axis
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

export const gainOrLossOptions: any = {
  plugins: {
    title: {
      text: "Gain/loss",
      display: true,
    },
  },
  scales: {
    x: {
      type: "time",
      time: {
        unit: "day",
      },
    },
    y: {
      ticks: {
        callback: function(value: any, index: any, ticks: any) {
            return '€ ' + value;
        }
    }
    },
  },
};

export const roiOptions: any = {
  plugins: {
    title: {
      text: "ROI",
      display: true,
    },
  },
  scales: {
    x: {
      type: "time",
      time: {
        unit: "day",
      },
    },
    y: {
      ticks: {
        callback: function(value: any, index: any, ticks: any) {
            return value + ' %';
        }
    }
    },
  },
};

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

export interface InvestmentUpdateRow {
  date: string
  name: string
  principal: number
  value: number
  gainOrLoss: number
  returnOnInvestment: number
}

export default function Home() {
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [investmentUpdates, setInvestmentUpdates] = useState<InvestmentUpdate[]>([]);
  const [transactons, setTransactions] = useState<Transaction[]>([]);

  const [investmentUpdateRows, setInvestmentUpdateRows] = useState<InvestmentUpdateRow[]>([]);

  useEffect(() => {
    fetchInvestments()
    fetchInvestmentUpdates()
    fetchTransactions()
  }, []);

  useEffect(() => {
    if (transactons && investmentUpdates) {
      const investmentUpdateRows = investmentUpdates.map((u) => {
        const investment = findInvestmentById(u.investmentId);
        const principal = calculatePrincipalForDate(
          new Date(u.date),
          transactons
        );
        const gainOrLoss = u.value - principal;
        const returnOnInvestment = gainOrLoss / principal;

        return {
          date: u.date,
          name: investment!.name,
          principal: principal,
          value: u.value,
          gainOrLoss: gainOrLoss,
          returnOnInvestment: returnOnInvestment,
        };
      });

      setInvestmentUpdateRows(investmentUpdateRows.sort(compareInvestmentUpdateRowByDate))
    }

  }, [transactons, investmentUpdates]);

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

  function compareInvestmentUpdateRowByDate(a: InvestmentUpdateRow, b: InvestmentUpdateRow): number {
    const dateA = new Date(a.date);
    const dateB = new Date(b.date);
    return dateA.getTime() - dateB.getTime();
  }

  function compareTransactionByDate(a: Transaction, b: Transaction): number {
    const dateA = new Date(a.date);
    const dateB = new Date(b.date);
    return dateA.getTime() - dateB.getTime();
  }

  const toGainOrLossData = (investmentUpdateRows: InvestmentUpdateRow[]) => {
    return {
      labels: [],
      datasets: [
        {
          label: investmentUpdateRows[0].name,
          data: investmentUpdateRows.map((u) => ({
              x: u.date,
              y: u.gainOrLoss / 100,
            })
          )
        },
      ],
    };
  };

  const toRoiData = (investmentUpdateRows: InvestmentUpdateRow[]) => {
    return {
      labels: [],
      datasets: [
        {
          label: investmentUpdateRows[0].name,
          data: investmentUpdateRows.map((u) => ({
              x: u.date,
              y: u.returnOnInvestment * 100,
            })
          )
        },
      ],
    };
  };

  const calculatePrincipalForDate = (date: Date, transactions: Transaction[]) => {
    transactions.sort(compareTransactionByDate)

    let sum = 0;
    for (const transaction of transactions) {
      const transactionDate = new Date(transaction.date);
      if (transactionDate <= date) {
        if (transaction.type == TransactionType.Buy) {
          sum += transaction.amount;
        } else {
          sum -= transaction.amount;
        }
      }
    }
    return sum;
  }

  const formatAsEuroAmount = (amount: number) => {
    const euroAmount = amount / 100
    return "€ " + euroAmount.toFixed(2)
  }

  function formatAsPercentage(number: number) {
    return (number * 100).toFixed(2) + "%";
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
        <UpdateInvestmentForm
          onAdd={fetchInvestmentUpdates}
          investments={investments}
        />
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
              {findInvestmentById(transaction.investmentId)?.name}{" "}
              {formatAsEuroAmount(transaction.amount)}
            </div>
          ))}
        <br />
        <h1 className="text-xl font-bold mb-3">Investment updates</h1>

        {investmentUpdateRows.length > 0 && (
          <table className="border px-3">
            <tr className="border">
              <th className="border px-3 text-left">Date</th>
              <th className="border px-3 text-left">Name</th>
              <th className="border px-3 text-left">Principal</th>
              <th className="border px-3 text-left">Value</th>
              <th className="border px-3 text-left">Gain/loss</th>
              <th className="border px-3 text-left">ROI</th>
            </tr>
            {investmentUpdateRows.map((investmentUpdateRow) => {
              return (
                <tr className="border">
                  <td className="border px-3">{investmentUpdateRow.date}</td>
                  <td className="border px-3">
                    {investmentUpdateRow.name}
                  </td>
                  <td className="border px-3">
                    {formatAsEuroAmount(investmentUpdateRow.principal)}
                  </td>
                  <td className="border px-3">
                    {formatAsEuroAmount(investmentUpdateRow.value)}
                  </td>
                  <td className="border px-3">
                    {formatAsEuroAmount(investmentUpdateRow.gainOrLoss)}
                  </td>
                  <td className="border px-3">
                    {formatAsPercentage(investmentUpdateRow.returnOnInvestment)}
                  </td>
                </tr>
              );
            })}
          </table>
        )}
        {investmentUpdateRows.length > 0 && (
          <Line options={gainOrLossOptions} data={toGainOrLossData(investmentUpdateRows)} />
        )}
        {investmentUpdateRows.length > 0 && (
          <Line options={roiOptions} data={toRoiData(investmentUpdateRows)} />
        )}
      </div>
    </main>
  );
}
