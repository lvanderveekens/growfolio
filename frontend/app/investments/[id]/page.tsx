"use client"

import { Investment, InvestmentUpdate } from "@/app/page";
import { Transaction } from "@/app/investments/transaction";
import { useEffect, useState } from "react";
import { capitalize, formatAsEuroAmount, formatAsPercentage } from "@/app/string";
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
import { calculateTotalPrincipalForDate, calculateTotalValueForDate } from "@/app/calculator";
import AddTransactionForm from "../add-transaction-form";
import UpdateInvestmentForm from "../update-investment-form";
import Modal from "@/app/modal";
import { FaXmark } from "react-icons/fa6";
import Link from "next/link";
import { Navbar } from "@/app/navbar";

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

export default function InvestmentPage({ params }: { params: { id: string } }) {
  const [investment, setInvestment] = useState<Investment>();
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string>()

  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [updates, setUpdates] = useState<InvestmentUpdate[]>([])

  const [updateDataPoints, setUpdateDataPoints] = useState<UpdateDataPoint[]>([])

  const [showUpdateInvestmentModal, setShowUpdateInvestmentModal] = useState<boolean>(false);
  const [showAddTransactionModal, setShowAddTransactionModal] = useState<boolean>(false);

  useEffect(() => {
    fetchInvestment()
    fetchTransactions()
    fetchUpdates()
  }, []);

  useEffect(() => {
    if (transactions.length > 0 && updates.length > 0) {
      setUpdateDataPoints(updates.map((update) => {
        const principal = calculateTotalPrincipalForDate(update.date, transactions)
        const value = calculateTotalValueForDate(update.date, updates)
        const returnValue = value - principal
        const roi = returnValue / principal;

        return {
          id: update.id,
          date: update.date,
          principal: principal,
          value: value,
          return: returnValue,
          roi: roi
        };
      }));
    }
  }, [transactions, updates]);

  const fetchInvestment = () => {
    fetch(`/api/v1/investments/${params.id}`)
      .then((res) => res.json())
      .then((data) => setInvestment(data))
      .catch((error) => {
        console.error(`Error fetching investment: ${error}`);
        setError(error)
      })
      .finally(() => setLoading(false));
    }

  const fetchTransactions = () => {
    fetch(`/api/v1/transactions?investmentId=${params.id}`)
      .then((res) => res.json())
      .then((data) => setTransactions(data));
  }

  const fetchUpdates = () => {
    fetch(`/api/v1/investment-updates?investmentId=${params.id}`)
      .then((res) => res.json())
      .then((data) => setUpdates(data));
  }

  const deleteUpdate = async (id: string) => {
    await fetch(`/api/v1/investment-updates/${id}`, {
      method: "DELETE",
    });
  }

  const deleteTransaction = async (id: string) => {
    await fetch(`/api/v1/transactions/${id}`, {
      method: "DELETE",
    });
  }

  return (
    <>
      <Navbar />
      <div className="p-8">
        {loading && <p>Loading...</p>}
        {error && <p>Error: ${error}</p>}
        {investment && (
          <>
            <div className="mb-8">
              <h1 className="text-3xl font-bold">
                Investment: {investment.name}
              </h1>
            </div>

            {updateDataPoints.length > 0 && (
              <div className="mb-8">
                <div className="mb-4">
                  Last update:{" "}
                  {updateDataPoints[updateDataPoints.length - 1].date}
                </div>
                <div className="flex gap-8 justify-between mb-4">
                  <div className="border grow flex justify-center items-center">
                    <div className="py-8">
                      <div>Principal</div>
                      <div className="text-3xl font-bold">
                        {formatAsEuroAmount(
                          updateDataPoints[updateDataPoints.length - 1]
                            .principal
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="border grow flex justify-center items-center">
                    <div className="py-8">
                      <div>Value</div>
                      <div className="text-3xl font-bold">
                        {formatAsEuroAmount(
                          updateDataPoints[updateDataPoints.length - 1].value
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="border grow flex justify-center items-center">
                    <div className="py-8">
                      <div>Return</div>
                      <div
                        className={`text-3xl font-bold ${
                          updateDataPoints[updateDataPoints.length - 1]
                            .return >= 0
                            ? "text-green-400"
                            : "text-red-400"
                        }`}
                      >
                        {formatAsEuroAmount(
                          updateDataPoints[updateDataPoints.length - 1].return
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="border grow flex justify-center items-center">
                    <div className="py-8">
                      <div>ROI</div>
                      <div
                        className={`text-3xl font-bold ${
                          updateDataPoints[updateDataPoints.length - 1].roi >= 0
                            ? "text-green-400"
                            : "text-red-400"
                        }`}
                      >
                        {formatAsPercentage(
                          updateDataPoints[updateDataPoints.length - 1].roi
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                <div>
                  <button className="border px-3 py-2 mr-4">
                    <Link href={`/investments/${params.id}/updates`}>
                      View updates
                    </Link>
                  </button>
                  <button className="border px-3 py-2">
                    <Link href={`/investments/${params.id}/transactions`}>
                      View transactions
                    </Link>
                  </button>
                </div>
              </div>
            )}

            <div className="mb-8">
              <h1 className="text-xl font-bold mb-4">Principal vs. Value</h1>
              <Line
                options={principalVsValueLineOptions}
                data={buildPrincipalVsValueLineData(updateDataPoints)}
              />
            </div>

            <div className="mb-8">
              <h1 className="text-xl font-bold mb-4">Return</h1>
              <Line
                options={returnLineOptions}
                data={buildReturnLineData(updateDataPoints)}
              />
            </div>

            <div className="mb-8">
              <h1 className="text-xl font-bold mb-4">ROI</h1>
              <Line
                options={roiLineOptions}
                data={buildROILineData(updateDataPoints)}
              />
            </div>
          </>
        )}
      </div>
    </>
  );
}

  const buildPrincipalVsValueLineData = (
    updateRows: UpdateDataPoint[]
  ) => {
    return {
      datasets: [
        {
          label: "Principal",
          borderColor: "rgb(255, 99, 132)",
          backgroundColor: "rgb(255, 99, 132)",
          data: updateRows.map((x) => ({
            x: x.date,
            y: x.principal / 100,
          })),
        },
        {
          label: "Value",
          borderColor: "rgb(54, 162, 235)",
          backgroundColor: "rgb(54, 162, 235)",
          data: updateRows.map((x) => ({
            x: x.date,
            y: x.value / 100,
          })),
        },
      ],
    };
  };

  const principalVsValueLineOptions: any = {
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
          tooltipFormat: "YYYY-MM-DD",
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

  const returnLineOptions: ChartOptions<"line"> = {
    interaction: {
      mode: "index",
      intersect: false,
    },
    plugins: {
      legend: {
        display: false,
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
          tooltipFormat: "YYYY-MM-DD",
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

  const roiLineOptions: ChartOptions<"line"> = {
    interaction: {
      mode: "index",
      intersect: false,
    },
    plugins: {
      legend: {
        display: false,
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
          tooltipFormat: "YYYY-MM-DD",
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

  interface UpdateDataPoint {
    id: string
    date: string;
    principal: number;
    value: number;
    return: number;
    roi: number;
  }

  const buildReturnLineData = (
    updateRows: UpdateDataPoint[]
  ) => {
    return {
      datasets: [
        {
          label: "Return",
          borderColor: "rgb(255, 99, 132)",
          backgroundColor: "rgb(255, 99, 132)",
          data: updateRows.map((x) => ({
            x: x.date,
            y: (x.value - x.principal) / 100,
          })),
        },
      ],
    };
  };

  const buildROILineData = (
    updateRows: UpdateDataPoint[]
  ) => {
    return {
      datasets: [
        {
          label: "ROI",
          borderColor: "rgb(255, 99, 132)",
          backgroundColor: "rgb(255, 99, 132)",
          data: updateRows.map((x) => ({
            x: x.date,
            y: (((x.value - x.principal) / x.principal) * 100).toFixed(2),
          })),
        },
      ],
    };
  };