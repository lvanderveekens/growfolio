'use client'

import Link from 'next/link';
import { useEffect, useState } from 'react';
import AddInvestmentForm from './add-investment-form';
import AddTransactionForm, { TransactionType } from './add-transaction-form';
import { InvestmentType } from './investment-type';
import UpdateInvestmentForm from './update-investment-form';

import {
  ArcElement,
  ChartData,
  Chart as ChartJS,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  TimeScale,
  Title,
  Tooltip,
} from 'chart.js';
import 'chartjs-adapter-moment';
import { Line, Pie } from 'react-chartjs-2';

ChartJS.register(
  ArcElement,
  Tooltip, 
  Legend,
  TimeScale, //Register timescale instead of category for X axis
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
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

export interface InvestmentRow {
  id: string
  name: string
  lastUpdateDate: string
  principal: number
  value: number
  gainOrLoss: number
  roiPercentage: number
}

export interface InvestmentUpdateRow {
  id: string
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
  const [investmentRows, setInvestmentRows] = useState<InvestmentRow[]>([]);

  useEffect(() => {
    fetchInvestments()
    fetchInvestmentUpdates()
    fetchTransactions()
  }, []);

  useEffect(() => {
    if (investmentUpdates.length > 0) {
      const investmentUpdateRows = investmentUpdates.map((u) => {
        const investment = findInvestmentById(u.investmentId);
        const principal = calculatePrincipalForDate(
          new Date(u.date),
          transactons
        );
        const gainOrLoss = u.value - principal;
        const returnOnInvestment = gainOrLoss / principal;

        return {
          id: u.id,
          date: u.date,
          name: investment?.name ?? "-- whut --",
          principal: principal,
          value: u.value,
          gainOrLoss: gainOrLoss,
          returnOnInvestment: returnOnInvestment,
        };
      });

      setInvestmentUpdateRows(investmentUpdateRows.sort(compareInvestmentUpdateRowByDate))

      const investmentRows = investments.map((i) => {
        investmentUpdates.sort(compareInvestmentUpdateByDateAsc)
        const lastUpdate = investmentUpdates.findLast((u) => u.investmentId == i.id)!

        const value = lastUpdate?.value ?? 0
        const principal = getInvestmentPrincipal(i);
        const gainOrLoss = value - principal;
        const roiPercentage = gainOrLoss / principal;

        return {
          id: i.id,
          name: i.name,
          lastUpdateDate: lastUpdate?.date ?? "-",
          principal: principal,
          value: value,
          gainOrLoss: gainOrLoss,
          roiPercentage: roiPercentage,
        } as InvestmentRow;
      });

      setInvestmentRows(investmentRows)
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

  function compareInvestmentUpdateByDateAsc(a: InvestmentUpdate, b: InvestmentUpdate): number {
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

  const getInvestmentPrincipal = (investment: Investment) => {
    const investmentTransactions = transactons.filter((transaction) => transaction.investmentId == investment.id)
    return investmentTransactions.reduce((acc, tx) => acc + tx.amount, 0);
  }

  const getInvestmentValue = (investment: Investment) => {
    investmentUpdates.sort(compareInvestmentUpdateByDateAsc)
    return investmentUpdates.findLast((update) => update.investmentId == investment.id)?.value ?? 0
  }

  const calculateAllocationPieData = (investments: Investment[]) => {
    // const totalValue = investments.reduce((acc, i) => acc + getInvestmentValue(i), 0)

    return {
      labels: investments.map((i) => i.name),
      datasets: [
        {
          label: "Value",
          backgroundColor: [
            'rgb(255, 99, 132)',
            'rgb(54, 162, 235)',
            'rgb(255, 205, 86)',
            'rgb(255, 86, 205)'
          ],
          data: investments.map((i) => {
            return getInvestmentValue(i) / 100
          }),
        },
      ],
    };
  };

  const calculateAllocationByTypePieData = (investments: Investment[]) => {
    interface InvestmentTypeWithValue {
      type: InvestmentType;
      value: number;
    }

    const investmentTypeWithValues = investments.reduce<
      InvestmentTypeWithValue[]
    >((acc, obj) => {
      const existing = acc.find((item) => item.type === obj.type);

      if (existing) {
        existing.value += getInvestmentValue(obj);
      } else {
        acc.push({ type: obj.type, value: getInvestmentValue(obj) });
      }

      return acc;
    }, []);

    return {
      labels: investmentTypeWithValues.map((i) => i.type),
      datasets: [
        {
          label: "Value",
          backgroundColor: [
            "rgb(255, 99, 132)",
            "rgb(54, 162, 235)",
            "rgb(255, 205, 86)",
            "rgb(255, 86, 205)",
          ],
          data: investmentTypeWithValues.map((i) => i.value / 100),
        },
      ],
    };
  };


  const totalPrincipal = investmentRows.reduce((acc, row) => acc + row.principal, 0)
  const totalValue = investmentRows.reduce((acc, row) => acc + row.value, 0)
  const totalGainOrLoss = totalValue - totalPrincipal;
  const totalRoiPercentage = totalGainOrLoss / totalPrincipal;

  return (
    <main>
      <nav className="mb-8 py-4 b-4 text-white bg-black">
        <div className="container mx-auto text-xl flex justify-between align-center">
          <div className="text-4xl font-bold self-center">
            <Link href="/">growfolio</Link>
          </div>
        </div>
      </nav>
      <div className="container mx-auto">
        <div className="mb-8">
          <h1 className="text-xl font-bold mb-4">Investments</h1>
          {investmentRows.length > 0 && (
            <div className='overflow-x-auto'>
              <table className="w-full whitespace-nowrap">
                <thead>
                  <tr className="border">
                    <th className="border px-3 text-left">Name</th>
                    <th className="border px-3 text-left">Principal</th>
                    <th className="border px-3 text-left">Value</th>
                    <th className="border px-3 text-left">Gain/loss</th>
                    <th className="border px-3 text-left">ROI</th>
                    <th className="border px-3 text-left">Last update</th>
                  </tr>
                </thead>
                <tbody>
                  {investmentRows.map((investmentRow) => {
                    return (
                      <tr key={investmentRow.id} className="border">
                        <td className="border px-3">{investmentRow.name}</td>
                        <td className="border px-3">
                          {formatAsEuroAmount(investmentRow.principal)}
                        </td>
                        <td className="border px-3">
                          {formatAsEuroAmount(investmentRow.value)}
                        </td>
                        <td className="border px-3">
                          {formatAsEuroAmount(investmentRow.gainOrLoss)}
                        </td>
                        <td className="border px-3">
                          {formatAsPercentage(investmentRow.roiPercentage)}
                        </td>
                        <td className="border px-3">
                          {investmentRow.lastUpdateDate}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="border">
                    <td className="border px-3">Total</td>
                    <td className="border px-3">
                      {formatAsEuroAmount(totalPrincipal)}
                    </td>
                    <td className="border px-3">
                      {formatAsEuroAmount(totalValue)}
                    </td>
                    <td className="border px-3">
                      {formatAsEuroAmount(totalGainOrLoss)}
                    </td>
                    <td className="border px-3">
                      {formatAsPercentage(totalRoiPercentage)}
                    </td>
                    <td className="border px-3"></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
        <div className="flex">
          <div className="w-[50%] aspect-square">
            <h1 className="text-xl font-bold mb-4">Allocation</h1>
            <Pie data={calculateAllocationPieData(investments)} />
          </div>
          <div className="w-[50%] aspect-square">
            <h1 className="text-xl font-bold mb-4">Allocation by type</h1>
            <Pie data={calculateAllocationByTypePieData(investments)} />
          </div>
        </div>

        <br />
        <br />
        <br />
        <br />
        <br />
        <br />
        <br />
        <br />
        <br />
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
            <thead>
              <tr className="border">
                <th className="border px-3 text-left">Date</th>
                <th className="border px-3 text-left">Name</th>
                <th className="border px-3 text-left">Principal</th>
                <th className="border px-3 text-left">Value</th>
                <th className="border px-3 text-left">Gain/loss</th>
                <th className="border px-3 text-left">ROI</th>
              </tr>
            </thead>
            <tbody>
              {investmentUpdateRows.map((investmentUpdateRow) => {
                return (
                  <tr key={investmentUpdateRow.id} className="border">
                    <td className="border px-3">{investmentUpdateRow.date}</td>
                    <td className="border px-3">{investmentUpdateRow.name}</td>
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
                      {formatAsPercentage(
                        investmentUpdateRow.returnOnInvestment
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
        {investmentUpdateRows.length > 0 && (
          <Line
            options={gainOrLossOptions}
            data={toGainOrLossData(investmentUpdateRows)}
          />
        )}
        {investmentUpdateRows.length > 0 && (
          <Line options={roiOptions} data={toRoiData(investmentUpdateRows)} />
        )}
      </div>
    </main>
  );
}
