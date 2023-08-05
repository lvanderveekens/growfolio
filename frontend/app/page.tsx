"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import AddInvestmentForm from "./add-investment-form";
import AddTransactionForm, { TransactionType } from "./add-transaction-form";
import { InvestmentType } from "./investment-type";
import UpdateInvestmentForm from "./update-investment-form";

import {
  ArcElement,
  ChartData,
  Chart as ChartJS,
  ChartOptions,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  TimeScale,
  Title,
  Tooltip,
  TooltipItem,
} from "chart.js";
import "chartjs-adapter-moment";
import { Line, Pie } from "react-chartjs-2";
import { _capitalize } from "chart.js/dist/helpers/helpers.core";

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
        callback: function (value: any, index: any, ticks: any) {
          return "€ " + value;
        },
      },
    },
  },
};

export const principalVsValueLineOptions: any = {
  interaction: {
    mode: "index",
    intersect: false,
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
        callback: function (value: any, index: any, ticks: any) {
          return "€ " + value;
        },
      },
    },
  },
};

export const returnVsRoiLineOptions: ChartOptions = {
  interaction: {
    mode: "index",
    intersect: false,
  },
  plugins: {
    tooltip: {
      callbacks: {
        label: function (context) {
          let label = context.dataset.label || "";
          if (label) {
            label += ": ";
          }
          if (context.parsed.y !== null) {
            if (context.datasetIndex == 0) {
              label += "€ " + context.parsed.y;
            } else {
              label += context.parsed.y + "%";
            }

            // label += new Intl.NumberFormat("en-US", {
            //   style: "currency",
            //   currency: "USD",
            // }).format(context.parsed.y);
          }

          return label;
        },
      },
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
      position: "left",
      ticks: {
        callback: function (value: any, index: any, ticks: any) {
          return "€ " + value;
        },
      },
    },
    y1: {
      position: "right",
      grid: {
        drawOnChartArea: false, // only want the grid lines for one axis to show up
      },
      ticks: {
        callback: function (value: any, index: any, ticks: any) {
          return value + "%";
        },
      },
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
        callback: function (value: any, index: any, ticks: any) {
          return value + " %";
        },
      },
    },
  },
};

export interface Investment {
  id: string;
  type: InvestmentType;
  name: string;
}

export interface InvestmentUpdate {
  id: string;
  date: string;
  investmentId: string;
  value: number;
}

export interface Transaction {
  id: string;
  date: string;
  type: TransactionType;
  investmentId: string;
  amount: number;
}

export interface InvestmentRow {
  id: string;
  name: string;
  lastUpdateDate: string;
  principal: number;
  value: number;
  return: number;
  roi: number;
}

export interface DateWithPrincipalAndValue {
  date: string;
  principal: number;
  value: number;
}

export interface InvestmentUpdateRow {
  id: string;
  date: string;
  name: string;
  principal: number;
  value: number;
  gainOrLoss: number;
  returnOnInvestment: number;
}

export default function Home() {
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [investmentUpdates, setInvestmentUpdates] = useState<
    InvestmentUpdate[]
  >([]);
  const [transactons, setTransactions] = useState<Transaction[]>([]);

  const [investmentUpdateRows, setInvestmentUpdateRows] = useState<
    InvestmentUpdateRow[]
  >([]);
  const [investmentRows, setInvestmentRows] = useState<InvestmentRow[]>([]);

  const [dateWithPrincipalAndValues, setDateWithPrincipalAndValues] = useState<
    DateWithPrincipalAndValue[]
  >([]);

  useEffect(() => {
    fetchInvestments();
    fetchInvestmentUpdates();
    fetchTransactions();
  }, []);

  useEffect(() => {
    if (investmentUpdates.length > 0) {
      const investmentUpdateRows = investmentUpdates.map((u) => {
        const investment = findInvestmentById(u.investmentId);
        const principal = calculateTotalPrincipalForDate(u.date, transactons);
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

      setInvestmentUpdateRows(
        investmentUpdateRows.sort(compareInvestmentUpdateRowByDate)
      );
    }

    if (investmentUpdates.length > 0) {
      const uniqueUpdateDates = Array.from(
        new Set(investmentUpdates.map((update) => update.date))
      );
      uniqueUpdateDates.sort();

      const dateWithPrincipalAndValues = uniqueUpdateDates.map((date) => {
        return {
          date: date,
          principal: calculateTotalPrincipalForDate(date, transactons),
          value: calculateTotalValueForDate(date, investmentUpdates),
        };
      });

      setDateWithPrincipalAndValues(dateWithPrincipalAndValues);
    }

    if (investments.length > 0) {
      const investmentRows = investments.map((i) => {
        const lastUpdate = investmentUpdates.findLast(
          (u) => u.investmentId == i.id
        )!;

        const value = lastUpdate?.value ?? 0;
        const principal = getInvestmentPrincipal(i);
        const gainOrLoss = value - principal;
        const roiPercentage = gainOrLoss / principal;

        return {
          id: i.id,
          name: i.name,
          lastUpdateDate: lastUpdate?.date ?? "-",
          principal: principal,
          value: value,
          return: gainOrLoss,
          roi: roiPercentage,
        } as InvestmentRow;
      });

      setInvestmentRows(investmentRows);
    }
  }, [investments, transactons, investmentUpdates]);

  const fetchInvestments = async () => {
    fetch(`http://localhost:8888/v1/investments`)
      .then((res) => res.json())
      .then((data) => {
        setInvestments(data);
      });
  };

  const fetchInvestmentUpdates = async () => {
    fetch(`http://localhost:8888/v1/investment-updates`)
      .then((res) => res.json())
      .then((investmentUpdates: InvestmentUpdate[]) => {
        investmentUpdates.sort(compareInvestmentUpdateByDateAsc);
        setInvestmentUpdates(investmentUpdates);
      });
  };

  const fetchTransactions = async () => {
    fetch(`http://localhost:8888/v1/transactions`)
      .then((res) => res.json())
      .then((transactions) => {
        transactions.sort(compareTransactionByDateAsc);
        setTransactions(transactions);
      });
  };

  const findInvestmentById = (id: string) => {
    return investments.find((i) => i.id == id);
  };

  function compareInvestmentUpdateRowByDate(
    a: InvestmentUpdateRow,
    b: InvestmentUpdateRow
  ): number {
    const dateA = new Date(a.date);
    const dateB = new Date(b.date);
    return dateA.getTime() - dateB.getTime();
  }

  function compareInvestmentUpdateByDateAsc(
    a: InvestmentUpdate,
    b: InvestmentUpdate
  ): number {
    const dateA = new Date(a.date);
    const dateB = new Date(b.date);
    return dateA.getTime() - dateB.getTime();
  }

  function compareTransactionByDateAsc(a: Transaction, b: Transaction): number {
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
          })),
        },
      ],
    };
  };

  const toPrincipalVsValueLineData = (
    dateAndPrincipalAndValue: DateWithPrincipalAndValue[]
  ) => {
    return {
      datasets: [
        {
          label: "Principal",
          borderColor: "rgb(255, 99, 132)",
          backgroundColor: "rgb(255, 99, 132)",
          data: dateAndPrincipalAndValue.map((x) => ({
            x: x.date,
            y: x.principal / 100,
          })),
        },
        {
          label: "Value",
          borderColor: "rgb(54, 162, 235)",
          backgroundColor: "rgb(54, 162, 235)",
          data: dateAndPrincipalAndValue.map((x) => ({
            x: x.date,
            y: x.value / 100,
          })),
        },
      ],
    };
  };

  const toReturnVsRoiLineData = (
    dateAndPrincipalAndValue: DateWithPrincipalAndValue[]
  ) => {
    return {
      datasets: [
        {
          label: "Return",
          borderColor: "rgb(255, 99, 132)",
          backgroundColor: "rgb(255, 99, 132)",
          data: dateAndPrincipalAndValue.map((x) => ({
            x: x.date,
            y: (x.value - x.principal) / 100,
          })),
          yAxisID: "y",
        },
        {
          label: "ROI",
          borderColor: "rgb(54, 162, 235)",
          backgroundColor: "rgb(54, 162, 235)",
          data: dateAndPrincipalAndValue.map((x) => ({
            x: x.date,
            y: (((x.value - x.principal) / x.principal) * 100).toFixed(2),
          })),
          yAxisID: "y1",
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
          })),
        },
      ],
    };
  };

  const calculateTotalPrincipalForDate = (
    date: string,
    transactions: Transaction[]
  ) => {
    let sum = 0;

    for (const transaction of transactions) {
      if (new Date(transaction.date) > new Date(date)) {
        break;
      }
      if (transaction.type == TransactionType.Buy) {
        sum += transaction.amount;
      } else {
        sum -= transaction.amount;
      }
    }
    return sum;
  };

  const calculateTotalValueForDate = (
    date: string,
    investmentUpdates: InvestmentUpdate[]
  ) => {
    const latestValueByInvestmentId = new Map<string, number>();

    for (const u of investmentUpdates) {
      if (new Date(u.date) > new Date(date)) {
        break;
      }
      latestValueByInvestmentId.set(u.investmentId, u.value);
    }

    return Array.from(latestValueByInvestmentId.values()).reduce(
      (acc, value) => acc + value,
      0
    );
  };

  const formatAsEuroAmount = (amount: number) => {
    const euroAmount = amount / 100;
    return "€ " + euroAmount.toFixed(2);
  };

  function formatAsPercentage(number: number) {
    return (number * 100).toFixed(2) + "%";
  }

  const getInvestmentPrincipal = (investment: Investment) => {
    const investmentTransactions = transactons.filter(
      (transaction) => transaction.investmentId == investment.id
    );
    return investmentTransactions.reduce((acc, tx) => acc + tx.amount, 0);
  };

  const getLatestInvestmentValue = (investment: Investment) => {
    return (
      investmentUpdates.findLast(
        (update) => update.investmentId == investment.id
      )?.value ?? 0
    );
  };

  const getTotalInvestmentValue = (investmentRows: InvestmentRow[]) => {
    return investmentRows.reduce((acc, row) => acc + row.value, 0);
  };

  const allocationPieOptions: ChartOptions = {
    plugins: {
      tooltip: {
        enabled: true,
        usePointStyle: true,
        callbacks: {
          label: function (context: TooltipItem<"pie">) {
            let label = context.dataset.label || "";
            if (label) {
              label += ": ";
            }
            
            const legendItems = context.chart.legend.legendItems
            const totalVisibleValue = legendItems.reduce((acc, legendItem, index) => {
              if (legendItem.hidden == false) {
                return acc + context.dataset.data[index];
              } else {
                return acc;
              }
            }, 0);


            console.log(totalVisibleValue)

            if (context.parsed !== null) {
              const valueString = formatAsEuroAmount(context.parsed);
              const totalValuePercentage = formatAsPercentage(
                context.parsed / totalVisibleValue
              );
              label += `${valueString} (${totalValuePercentage})`;
            }
            return label;
          },
        },
      },
    },
  };

  const calculateAllocationPieData = (investments: Investment[]) => {
    return {
      labels: investments.map((i) => i.name),
      datasets: [
        {
          label: "Value",
          backgroundColor: [
            "rgb(255, 99, 132)",
            "rgb(54, 162, 235)",
            "rgb(255, 205, 86)",
            "rgb(255, 86, 205)",
            "rgb(87, 255, 205)",
          ],
          data: investments.map((i) => {
            return getLatestInvestmentValue(i)
          }) ,
        },
      ],
    } as ChartData<"pie">;
  };

  function capitalize(input: string): string {
    return input.charAt(0).toUpperCase() + input.slice(1);
  }

  const calculateAllocationByTypePieData = (investments: Investment[]) => {
    interface InvestmentTypeWithValue {
      type: InvestmentType;
      value: number;
    }

    const investmentTypeWithValues = investments.reduce<
      InvestmentTypeWithValue[]
    >((acc, i) => {
      const existing = acc.find((item) => item.type === i.type);

      if (existing) {
        existing.value += getLatestInvestmentValue(i);
      } else {
        acc.push({ type: i.type, value: getLatestInvestmentValue(i) });
      }

      return acc;
    }, []);

    return {
      labels: investmentTypeWithValues.map((i) => capitalize(i.type)),
      datasets: [
        {
          label: "Value",
          backgroundColor: [
            "rgb(255, 99, 132)",
            "rgb(54, 162, 235)",
            "rgb(255, 205, 86)",
            "rgb(255, 86, 205)",
          ],
          data: investmentTypeWithValues.map((i) => {
            return i.value;
          }) 
        },
      ],
    };
  };

  const totalPrincipal = investmentRows.reduce(
    (acc, row) => acc + row.principal,
    0
  );
  const totalValue = investmentRows.reduce((acc, row) => acc + row.value, 0);
  const totalReturn = totalValue - totalPrincipal;
  const totalRoi = totalReturn / totalPrincipal;

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
          <h1 className="text-xl font-bold mb-4">My investments</h1>
          {investmentRows.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full whitespace-nowrap">
                <thead>
                  <tr className="border">
                    <th className="border px-3 text-left">Name</th>
                    <th className="border px-3 text-left">Principal</th>
                    <th className="border px-3 text-left">Value</th>
                    <th className="border px-3 text-left">Return</th>
                    <th className="border px-3 text-left">ROI</th>
                    <th className="border px-3 text-left">Last update</th>
                  </tr>
                </thead>
                <tbody>
                  {investmentRows.map((investmentRow) => {
                    return (
                      <tr key={investmentRow.id} className="border cursor-pointer hover:bg-red-500">
                        <td className="border px-3">{investmentRow.name}</td>
                        <td className="border px-3">
                          {formatAsEuroAmount(investmentRow.principal)}
                        </td>
                        <td className="border px-3">
                          {formatAsEuroAmount(investmentRow.value)}
                        </td>
                        <td className="border px-3">
                          {formatAsEuroAmount(investmentRow.return)}
                        </td>
                        <td className="border px-3">
                          {formatAsPercentage(investmentRow.roi)}
                        </td>
                        <td className="border px-3">
                          {investmentRow.lastUpdateDate}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="border-2 border-t-black">
                  <tr className="border">
                    <td className="border px-3">Total</td>
                    <td className="border px-3">
                      {formatAsEuroAmount(totalPrincipal)}
                    </td>
                    <td className="border px-3">
                      {formatAsEuroAmount(totalValue)}
                    </td>
                    <td className="border px-3">
                      {formatAsEuroAmount(totalReturn)}
                    </td>
                    <td className="border px-3">
                      {formatAsPercentage(totalRoi)}
                    </td>
                    <td className="border px-3"></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
        <div className="mb-8 flex">
          <div className="w-[50%] aspect-square">
            <h1 className="text-xl font-bold mb-4">Allocation</h1>
            <Pie options={allocationPieOptions} data={calculateAllocationPieData(investments)} />
          </div>
          <div className="w-[50%] aspect-square">
            <h1 className="text-xl font-bold mb-4">Allocation by type</h1>
            <Pie options={allocationPieOptions} data={calculateAllocationByTypePieData(investments)} />
          </div>
        </div>

        {investmentUpdateRows.length > 0 && (
          <div className="mb-8">
            <h1 className="text-xl font-bold mb-4">Principal vs. Value</h1>
            <Line
              options={principalVsValueLineOptions}
              data={toPrincipalVsValueLineData(dateWithPrincipalAndValues)}
            />
          </div>
        )}

        {investmentUpdateRows.length > 0 && (
          <div>
            <h1 className="text-xl font-bold mb-4">Return vs. ROI</h1>
            <Line
              options={returnVsRoiLineOptions}
              data={toReturnVsRoiLineData(dateWithPrincipalAndValues)}
            />
          </div>
        )}

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
