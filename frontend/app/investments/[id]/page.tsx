"use client"

import { api } from "@/app/axios";
import { calculateTotalPrincipalForDate } from "@/app/calculator";
import { Transaction } from "@/app/investments/transaction";
import { Navbar } from "@/app/navbar";
import { Investment, InvestmentUpdate } from "@/app/page";
import { formatAsEuroAmount, formatAsPercentage } from "@/app/string";
import {
  ArcElement,
  BarElement,
  ChartData,
  Chart as ChartJS,
  ChartOptions,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  TimeScale,
  Title,
  Tooltip
} from "chart.js";
import "chartjs-adapter-moment";
import moment from "moment";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Bar, Line } from "react-chartjs-2";

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  TimeScale, //Register timescale instead of category for X axis
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
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
  const [monthlyChangeDataPoints, setMonthlyChangeDataPoints] = useState<MonthlyChangeDataPoint[]>([])

  const [timeRangeDays, setTimeRangeDays] = useState<number>(6 * 30)

  useEffect(() => {
    fetchInvestment()
    fetchTransactions()
    fetchUpdates()
  }, []);

  useEffect(() => {
    const updateDataPoints = updates.map((update) => {
      const principal = calculateTotalPrincipalForDate(
        update.date,
        transactions
      );
      const value = update.value;
      const returnValue = value - principal;
      const roi = returnValue / principal;

      return {
        id: update.id,
        date: update.date,
        principal: principal,
        value: value,
        return: returnValue,
        roi: roi,
      };
    });

    setUpdateDataPoints(updateDataPoints);
    setMonthlyChangeDataPoints(
      calculateMonthlyChangeDataPoints(updateDataPoints)
    );
  }, [transactions, updates]);

  const calculateMonthlyChangeDataPoints = (updateDataPoints: UpdateDataPoint[]) => {
    console.log("calculating monthly change data points...")

    const lastUpdateByMonth = updateDataPoints.reduce((acc, obj) => {
      const yearMonthKey = obj.date.substr(0, 7);
      acc.set(yearMonthKey, obj);
      return acc;
    }, new Map<string, UpdateDataPoint>());
    console.log(lastUpdateByMonth)

    const dataPoints = []
    const lastUpdateByMonthEntries = Array.from(lastUpdateByMonth.entries());

    for (let i = 1; i < lastUpdateByMonthEntries.length; i++) {
      const previousUpdate = lastUpdateByMonthEntries[i - 1];
      const currentUpdate = lastUpdateByMonthEntries[i];

      dataPoints.push({
        yearAndMonth: currentUpdate[0],
        value: (currentUpdate[1].value - previousUpdate[1].value),
        principal: (currentUpdate[1].principal - previousUpdate[1].principal),
        return: (currentUpdate[1].return - previousUpdate[1].return),
      });
    }
    return dataPoints
  } 

  const fetchInvestment = () => {
    api.get(`/v1/investments/${params.id}`)
      .then((res) => setInvestment(res.data))
      .catch((error) => {
        console.error(`Error fetching investment: ${error}`);
        setError(error)
      })
      .finally(() => setLoading(false));
    }

  const fetchTransactions = () => {
    api.get(`/v1/transactions?investmentId=${params.id}`)
      .then((res) => setTransactions(res.data));
  }

  const fetchUpdates = () => {
    // TODO: server side time range filter
    api.get(`/v1/investment-updates?investmentId=${params.id}`)
      .then((res) => {
        // const currentDate = new Date();
        // const dateThreshold = new Date(currentDate);
        // dateThreshold.setDate(currentDate.getDate() - timeRangeDays);

        // const filteredUpdates = updates.filter((update) =>
        //   moment(update.date).isAfter(dateThreshold)
        // );

        setUpdates(res.data);
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
                  <button className="border px-3 py-2 mr-4">
                    <Link href={`/investments/${params.id}/transactions`}>
                      View transactions
                    </Link>
                  </button>
                  <button
                    className="border px-3 py-2 mr-4 text-white bg-red-500 border-red-500"
                    onClick={() => console.log("delete!")}
                  >
                    Delete investment
                  </button>
                </div>
              </div>
            )}

            <div className="mb-8">
              <h1 className="text-xl font-bold mb-4">Principal and value</h1>
              <Line
                options={principalAndValueLineOptions}
                data={buildPrincipalAndValueLineData(updateDataPoints)}
              />
            </div>

            <div className="mb-8">
              <h1 className="text-xl font-bold mb-4">Monthly growth</h1>
              <Bar
                options={monthlyGrowthBarOptions}
                data={buildMonthlyGrowthBarData(monthlyChangeDataPoints)}
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

  const buildPrincipalAndValueLineData = (
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

  const principalAndValueLineOptions: any = {
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

  const monthlyReturnBarOptions: ChartOptions<"bar"> = {
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
          unit: "month",
          tooltipFormat: "YYYY-MM",
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

export const monthlyGrowthBarOptions: ChartOptions<"bar"> = {
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
        stacked: true,
        type: "time",
        time: {
          unit: "month",
          tooltipFormat: "YYYY-MM",
        },
      },
      y: {
        stacked: true,
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

  interface MonthlyChangeDataPoint {
    yearAndMonth: string;
    value: number;
    principal: number;
    return: number;
  }

  const buildReturnLineData = (
    updateDataPoints: UpdateDataPoint[]
  ) => {
    return {
      datasets: [
        {
          label: "Return",
          borderColor: "rgb(255, 99, 132)",
          backgroundColor: "rgb(255, 99, 132)",
          data: updateDataPoints.map((x) => ({
            x: x.date,
            y: (x.value - x.principal) / 100,
          })),
        },
      ],
    };
  };

  const buildMonthlyReturnBarData = (
    monthlyChangeDataPoints: MonthlyChangeDataPoint[]
  ): ChartData<"bar"> => {
    return {
      datasets: [
        {
          label: "Monthly return",
          borderColor: "rgb(255, 99, 132)",
          backgroundColor: "rgb(255, 99, 132)",
          data: monthlyChangeDataPoints.map((dataPoint) => ({
            x: dataPoint.yearAndMonth,
            y: (dataPoint.return / 100),
          })),
        },
      ],
    };
  };

export const buildMonthlyGrowthBarData = (
    monthlyChangeDataPoints: MonthlyChangeDataPoint[]
  ): ChartData<"bar"> => {
    return {
      datasets: [
        {
          label: "Principal",
          borderColor: "rgb(54, 162, 235)",
          backgroundColor: "rgb(54, 162, 235)",
          data: monthlyChangeDataPoints.map((dataPoint) => ({
            x: dataPoint.yearAndMonth,
            y: (dataPoint.principal / 100),
          })),
        },
        {
          label: "Return",
          borderColor: "rgb(255, 130, 32)",
          backgroundColor: "rgb(255, 130, 32)",
          data: monthlyChangeDataPoints.map((dataPoint) => ({
            x: dataPoint.yearAndMonth,
            y: (dataPoint.return / 100),
          })),
        },
      ],
    };
  };

  const buildROILineData = (
    updateDataPoints: UpdateDataPoint[]
  ) => {
    return {
      datasets: [
        {
          label: "ROI",
          borderColor: "rgb(255, 99, 132)",
          backgroundColor: "rgb(255, 99, 132)",
          data: updateDataPoints.map((x) => ({
            x: x.date,
            y: (((x.value - x.principal) / x.principal) * 100).toFixed(2),
          })),
        },
      ],
    };
  };