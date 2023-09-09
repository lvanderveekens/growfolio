"use client";

import { useEffect, useState } from "react";
import { InvestmentType } from "./investment-type";
import AddInvestmentForm from "./investments/add-investment-form";

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
import { calculateTotalPrincipalForDate, calculateTotalValueForDate } from "./calculator";
import { Transaction } from "./investments/transaction";
import Modal from "./modal";
import { capitalize, formatAsEuroAmount, formatAsPercentage } from "./string";
import { Navbar } from "./navbar";
// import ChartDataLabels from 'chartjs-plugin-datalabels';

ChartJS.register(
  // ChartDataLabels,
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

export default function HomePage() {
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
        const returnValue = u.value - principal;
        const roi = returnValue / principal;

        return {
          id: u.id,
          date: u.date,
          name: investment?.name ?? "-- whut --",
          principal: principal,
          value: u.value,
          return: returnValue,
          roi: roi,
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
        const returnValue = value - principal;
        const roi = returnValue / principal;

        return {
          id: i.id,
          name: i.name,
          lastUpdateDate: lastUpdate?.date ?? "-",
          principal: principal,
          value: value,
          return: returnValue,
          roi: roi,
        } as InvestmentRow;
      });

      setInvestmentRows(investmentRows);
    }
  }, [investments, transactons, investmentUpdates]);

  const fetchInvestments = async () => {
    fetch(`/api/v1/investments`)
      .then((res) => res.json())
      .then((data) => {
        setInvestments(data);
      });
  };

  const fetchInvestmentUpdates = async () => {
    fetch(`/api/v1/investment-updates`)
      .then((res) => res.json())
      .then((investmentUpdates: InvestmentUpdate[]) => {
        investmentUpdates.sort(compareInvestmentUpdateByDateAsc);
        setInvestmentUpdates(investmentUpdates);
      });
  };

  const fetchTransactions = async () => {
    fetch(`/api/v1/transactions`)
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

  const buildPrincipalVsValueLineData = (
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

  const buildReturnLineData = (
    dateWithPrincipalAndValue: DateWithPrincipalAndValue[]
  ) => {
    return {
      datasets: [
        {
          label: "Return",
          borderColor: "rgb(255, 99, 132)",
          backgroundColor: "rgb(255, 99, 132)",
          data: dateWithPrincipalAndValue.map((x) => ({
            x: x.date,
            y: (x.value - x.principal) / 100,
          })),
        },
      ],
    };
  };

  const buildROILineData = (
    dateWithPrincipalAndValue: DateWithPrincipalAndValue[]
  ) => {
    return {
      datasets: [
        {
          label: "ROI",
          borderColor: "rgb(255, 99, 132)",
          backgroundColor: "rgb(255, 99, 132)",
          data: dateWithPrincipalAndValue.map((x) => ({
            x: x.date,
            y: (((x.value - x.principal) / x.principal) * 100).toFixed(2),
          })),
        },
      ],
    };
  };

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

  const [showAddInvestmentModal, setShowAddInvestmentModal] =
    useState<boolean>(false);

  return (
    <main>
      <Navbar />
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-8">Overview</h1>
          {investmentRows.length > 0 && (
            <div className="overflow-x-auto mb-4">
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
                      <tr key={investmentRow.id} className="border">
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

          <button
            className="border px-3 py-2"
            type="submit"
            onClick={() => setShowAddInvestmentModal(true)}
          >
            Add investment
          </button>
          {showAddInvestmentModal && (
            <Modal
              title="Add investment"
              onClose={() => setShowAddInvestmentModal(false)}
            >
              <AddInvestmentForm
                onAdd={() => {
                  setShowAddInvestmentModal(false);
                  window.location.reload();
                }}
              />
            </Modal>
          )}
        </div>
        <div className="mb-8 flex gap-8">
          <div className="w-[50%] aspect-square">
            <h1 className="text-xl font-bold mb-4">Allocation</h1>
            <Pie
              options={allocationPieOptions}
              data={calculateAllocationPieData(investments)}
            />
          </div>
          <div className="w-[50%] aspect-square">
            <h1 className="text-xl font-bold mb-4">Allocation by type</h1>
            <Pie
              options={allocationPieOptions}
              data={calculateAllocationByTypePieData(investments)}
            />
          </div>
        </div>

        {investmentUpdateRows.length > 0 && (
          <div className="mb-8">
            <h1 className="text-xl font-bold mb-4">Principal vs. Value</h1>
            <Line
              options={principalVsValueLineOptions}
              data={buildPrincipalVsValueLineData(dateWithPrincipalAndValues)}
            />
          </div>
        )}

        {dateWithPrincipalAndValues.length > 0 && (
          <div className="mb-8">
            <h1 className="text-xl font-bold mb-4">Return</h1>
            <Line
              options={returnLineOptions}
              data={buildReturnLineData(dateWithPrincipalAndValues)}
            />
          </div>
        )}

        {dateWithPrincipalAndValues.length > 0 && (
          <div className="mb-8">
            <h1 className="text-xl font-bold mb-4">ROI</h1>
            <Line
              options={roiLineOptions}
              data={buildROILineData(dateWithPrincipalAndValues)}
            />
          </div>
        )}
      </div>
    </main>
  );
}

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
  plugins: {
    tooltip: {
      callbacks: {
        label: function (context) {
          let label = context.dataset.label || "";
          if (label) {
            label += ": ";
          }
          if (context.parsed.y !== null) {
            label += "€ " + context.parsed.y;
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
        tooltipFormat: 'YYYY-MM-DD' 
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

export const returnLineOptions: ChartOptions = {
  interaction: {
    mode: "index",
    intersect: false,
  },
  plugins: {
    legend: {
      display: false
    },
    tooltip: {
      callbacks: {
        label: function (context) {
          let label = context.dataset.label || "";
          if (label) {
            label += ": ";
          }
          if (context.parsed.y !== null) {
            label += "€ " + context.parsed.y;
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
        tooltipFormat: 'YYYY-MM-DD' 
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

export const roiLineOptions: ChartOptions = {
  interaction: {
    mode: "index",
    intersect: false,
  },
  plugins: {
    legend: {
      display: false
    },
    tooltip: {
      callbacks: {
        label: function (context) {
          let label = context.dataset.label || "";
          if (label) {
            label += ": ";
          }
          if (context.parsed.y !== null) {
            label += context.parsed.y + "%";
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
        tooltipFormat: 'YYYY-MM-DD' 
      },
    },
    y: {
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

export interface User {
  id: string;
  email: string;
  provider: string;
}

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
  return: number;
  roi: number;
}
