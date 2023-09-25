"use client"

import { api } from "@/app/axios";
import { calculateTotalPrincipalForDate } from "@/app/calculator";
import { Transaction } from "@/app/investments/transaction";
import Modal from "@/app/modal";
import { Navbar } from "@/app/navbar";
import { Investment, InvestmentUpdate, YearlyChangeDataPoint, calculateYearlyChangeDataPoints, chartBackgroundColors } from "@/app/page";
import { formatAmountAsEuroString, formatAmountInCentsAsEuroString, formatAsPercentage } from "@/app/string";
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
import { useRouter } from "next/navigation";
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
  const [yearlyChangeDataPoints, setYearlyChangeDataPoints] = useState<YearlyChangeDataPoint[]>([])

  const [showDeleteInvestmentModal, setShowDeleteInvestmentModal] = useState<boolean>(false);

  const router = useRouter()

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
    setYearlyChangeDataPoints(
      calculateYearlyChangeDataPoints(updateDataPoints)
    );
  }, [transactions, updates]);

  const calculateMonthlyChangeDataPoints = (updateDataPoints: UpdateDataPoint[]) => {
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

  const deleteInvestment = () => {
    api.delete(`/v1/investments/${params.id}`)
    .then((res) => {
      if (res.status == 204) {
        router.push("/")
      }
    })
    .catch((err) => console.log(err))
  };

  const findLastUpdate = () => {
    if (updateDataPoints.length > 0) {
      return updateDataPoints[updateDataPoints.length - 1]
    }
    return undefined
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

            <div className="mb-8">
              <div className="mb-4">
                Last update: {findLastUpdate()?.date ?? "-"}
              </div>
              <div className="flex gap-8 justify-between mb-4">
                <div className="border grow flex justify-center items-center">
                  <div className="py-8">
                    <div>Principal</div>
                    <div className="text-3xl font-bold">
                      {updateDataPoints.length > 0
                        ? formatAmountInCentsAsEuroString(
                            updateDataPoints[updateDataPoints.length - 1]
                              .principal
                          )
                        : "-"}
                    </div>
                  </div>
                </div>
                <div className="border grow flex justify-center items-center">
                  <div className="py-8">
                    <div>Value</div>
                    <div className="text-3xl font-bold">
                      {updateDataPoints.length > 0
                        ? formatAmountInCentsAsEuroString(
                            updateDataPoints[updateDataPoints.length - 1].value
                          )
                        : "-"}
                    </div>
                  </div>
                </div>
                <div className="border grow flex justify-center items-center">
                  <div className="py-8">
                    <div>Return</div>
                    <div
                      className={`text-3xl font-bold 
                        ${
                          (findLastUpdate()?.return ?? 0) > 0
                            ? "text-green-400"
                            : ""
                        }
                        ${
                          (findLastUpdate()?.return ?? 0) < 0
                            ? "text-red-400"
                            : ""
                        }
                      }`}
                    >
                      {updateDataPoints.length > 0
                        ? formatAmountInCentsAsEuroString(
                            updateDataPoints[updateDataPoints.length - 1].return
                          )
                        : "-"}
                    </div>
                  </div>
                </div>
                <div className="border grow flex justify-center items-center">
                  <div className="py-8">
                    <div>ROI</div>
                    <div
                      className={`text-3xl font-bold 
                        ${
                          (findLastUpdate()?.roi ?? 0) > 0
                            ? "text-green-400"
                            : ""
                        }
                        ${
                          (findLastUpdate()?.roi ?? 0) < 0 ? "text-red-400" : ""
                        }
                      }`}
                    >
                      {updateDataPoints.length > 0
                        ? formatAsPercentage(
                            updateDataPoints[updateDataPoints.length - 1].roi
                          )
                        : "-"}
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
                  onClick={() => setShowDeleteInvestmentModal(true)}
                >
                  Delete investment
                </button>
                {showDeleteInvestmentModal && (
                  <Modal
                    title="Delete investment"
                    onClose={() => setShowDeleteInvestmentModal(false)}
                  >
                    Are you sure?
                    <div className="flex justify-end">
                      <button
                        className="border px-3 py-2 mr-4"
                        onClick={() => setShowDeleteInvestmentModal(false)}
                      >
                        Cancel
                      </button>
                      <button
                        className="border px-3 py-2 text-white bg-red-500 border-red-500"
                        onClick={deleteInvestment}
                      >
                        Delete
                      </button>
                    </div>
                  </Modal>
                )}
              </div>
            </div>

            {updateDataPoints.length > 0 && (
              <>
                <div className="mb-8">
                  <h1 className="text-xl font-bold mb-4">
                    Principal and value
                  </h1>
                  <Line
                    options={principalAndValueLineOptions}
                    data={buildPrincipalAndValueLineData(updateDataPoints)}
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

                <div className="mb-8">
                  <h1 className="text-xl font-bold mb-4">Monthly growth</h1>
                  <Bar
                    options={monthlyGrowthBarOptions}
                    data={buildMonthlyGrowthBarData(monthlyChangeDataPoints)}
                  />
                </div>

                <div className="mb-8">
                  <h1 className="text-xl font-bold mb-4">Yearly growth</h1>
                  <Bar
                    options={yearlyGrowthBarOptions}
                    data={buildYearlyGrowthBarData(yearlyChangeDataPoints)}
                  />
                </div>
              </>
            )}
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
          borderColor: chartBackgroundColors[0],
          backgroundColor: chartBackgroundColors[0],
          data: updateRows.map((x) => ({
            x: x.date,
            y: x.principal / 100,
          })),
        },
        {
          label: "Value",
          borderColor: chartBackgroundColors[1],
          backgroundColor: chartBackgroundColors[1],
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
              label += formatAmountAsEuroString(context.parsed.y);
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
          tooltipFormat: "YYYY-MM-DD",
        },
      },
      y: {
        ticks: {
          callback: function (value: any, index: any, ticks: any) {
            return formatAmountAsEuroString(value);
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
              label += formatAmountAsEuroString(context.parsed.y);
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
          tooltipFormat: "YYYY-MM-DD",
        },
      },
      y: {
        ticks: {
          callback: function (value: any, index: any, ticks: any) {
            return formatAmountAsEuroString(value);
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
              label += formatAmountAsEuroString(context.parsed.y);
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
            return formatAmountAsEuroString(value);
          },
        },
      },
    },
  };

export const yearlyGrowthBarOptions: ChartOptions<"bar"> = {
    plugins: {
      tooltip: {
        callbacks: {
          label: function (context) {
            let label = context.dataset.label || "";
            if (label) {
              label += ": ";
            }
            if (context.parsed.y !== null) {
              label += formatAmountAsEuroString(context.parsed.y);
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
          unit: "year",
          tooltipFormat: "YYYY",
        },
      },
      y: {
        stacked: true,
        ticks: {
          callback: function (value: any, index: any, ticks: any) {
            return formatAmountAsEuroString(value);
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
          unit: "month",
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
          borderColor: chartBackgroundColors[0],
          backgroundColor: chartBackgroundColors[0],
          data: updateDataPoints.map((x) => ({
            x: x.date,
            y: (x.value - x.principal) / 100,
          })),
        },
      ],
    };
  };

export const buildMonthlyGrowthBarData = (
  monthlyChangeDataPoints: MonthlyChangeDataPoint[]
): ChartData<"bar"> => {
  console.log(monthlyChangeDataPoints);
  return {
    datasets: [
      {
        label: "Principal",
        borderColor: chartBackgroundColors[0],
        backgroundColor: chartBackgroundColors[0],
        data: monthlyChangeDataPoints.map((dataPoint) => ({
          x: dataPoint.yearAndMonth,
          y: dataPoint.principal / 100,
        })),
      },
      {
        label: "Return",
        borderColor: chartBackgroundColors[1],
        backgroundColor: chartBackgroundColors[1],
        data: monthlyChangeDataPoints.map((dataPoint) => ({
          x: dataPoint.yearAndMonth,
          y: dataPoint.return / 100,
        })),
      },
    ],
  };
};

export const buildYearlyGrowthBarData = (
  yearlyChangeDataPoints: YearlyChangeDataPoint[]
): ChartData<"bar"> => {
  console.log(yearlyChangeDataPoints);
  return {
    datasets: [
      {
        label: "Principal",
        borderColor: chartBackgroundColors[0],
        backgroundColor: chartBackgroundColors[0],
        data: yearlyChangeDataPoints.map((dataPoint) => ({
          x: dataPoint.year,
          y: dataPoint.principal / 100,
        })),
      },
      {
        label: "Return",
        borderColor: chartBackgroundColors[1],
        backgroundColor: chartBackgroundColors[1],
        data: yearlyChangeDataPoints.map((dataPoint) => ({
          x: dataPoint.year,
          y: dataPoint.return / 100,
        })),
      },
    ],
  };
};
const buildROILineData = (updateDataPoints: UpdateDataPoint[]) => {
  return {
    datasets: [
      {
        label: "ROI",
        borderColor: chartBackgroundColors[0],
        backgroundColor: chartBackgroundColors[0],
        data: updateDataPoints.map((x) => ({
          x: x.date,
          y: (((x.value - x.principal) / x.principal) * 100).toFixed(2),
        })),
      },
    ],
  };
};