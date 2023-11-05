"use client"

import { api } from "@/app/axios";
import { calculateTotalPrincipalForDate } from "@/app/calculator";
import { Transaction } from "@/app/investments/transaction";
import { useLocalStorage } from "@/app/localstorage";
import Modal from "@/app/modal";
import { DateRange, Investment, InvestmentUpdate, MonthlyDataPoint, YearlyChangeDataPoint, calculateMonthlyChangeDataPoints, calculateYearlyChangeDataPoints, chartBackgroundColors, convertToDate, getAmountTextColor } from "@/app/overview-page";
import { Settings } from "@/app/settings/settings";
import { formatAmountAsCurrencyString, formatAmountInCentsAsCurrencyString, formatAsROIPercentage } from "@/app/string";
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
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Bar, Line } from "react-chartjs-2";
import { InvestmentIsLockedMessage } from "../investment-locked-message";
import AppLayout from "@/app/app-layout";

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  TimeScale, 
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
  const [monthlyChangeDataPoints, setMonthlyChangeDataPoints] = useState<MonthlyDataPoint[]>([])
  const [yearlyChangeDataPoints, setYearlyChangeDataPoints] = useState<YearlyChangeDataPoint[]>([])

  const [showDeleteInvestmentModal, setShowDeleteInvestmentModal] = useState<boolean>(false);

  const router = useRouter()

  const [selectedDateRange, setSelectedDateRange] = useLocalStorage<DateRange>("growfolio-selected-date-range", DateRange.ALL)

  const [settings, setSettings] = useState<Settings>();

  useEffect(() => {
    fetchInvestment()
    fetchInvestmentUpdates()
    fetchTransactions()
    fetchSettings()
  }, [selectedDateRange]);

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

  const fetchInvestment = () => {
    api.get(`/investments/${params.id}`)
      .then((res) => setInvestment(res.data))
      .catch((error) => {
        console.error(`Error fetching investment: ${error}`);
        setError(error)
      })
      .finally(() => setLoading(false));
    }

  const fetchTransactions = () => {
    api.get(`/transactions?investmentId=${params.id}`)
      .then((res) => setTransactions(res.data));
  }

  const fetchSettings = async () => {
    api.get(`/settings`).then((res) => {
      setSettings(res.data);
    });
  };

  const fetchInvestmentUpdates = () => {
    const dateFrom = convertToDate(selectedDateRange)
      ?.toISOString()
      ?.split("T")?.[0];

    api
      .get(`/investment-updates?investmentId=${params.id}`, {
        params: {
          ...(dateFrom && { dateFrom: dateFrom }),
        },
      })
      .then((res) => setUpdates(res.data));
  };

  const deleteInvestment = () => {
    api
      .delete(`/investments/${params.id}`)
      .then((res) => {
        if (res.status == 204) {
          router.push("/");
        }
      })
      .catch((err) => console.log(err));
  };

  const findLastUpdate = () => {
    if (updateDataPoints.length > 0) {
      return updateDataPoints[updateDataPoints.length - 1]
    }
    return undefined
  }

  return (
    <AppLayout>
      <div className="container my-4">
        {loading && <p>Loading...</p>}
        {error && <p>Error: ${error}</p>}
        {investment && (
          <>
            <div className="mb-4">
              <h1 className="text-3xl sm:text-3xl font-bold">
                Investment: {investment.name}
              </h1>
            </div>

            {investment.locked && <InvestmentIsLockedMessage />}

            <div className="mb-4">
              <label className="">Date range:</label>
              <select
                value={selectedDateRange}
                onChange={(e) => setSelectedDateRange(e.target.value)}
                className="border border-1 block w-full lg:w-auto"
              >
                {Object.values(DateRange).map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>

            <h2 className="text-2xl font-bold mb-4">Value</h2>

            <div className="mb-4">
              <div className="mb-4">
                Last update: {findLastUpdate()?.date ?? "-"}
              </div>

              <div className="border p-12 text-center mb-4">
                <div className="font-bold text-3xl">
                  {settings &&
                    formatAmountInCentsAsCurrencyString(
                      findLastUpdate()?.value ?? 0,
                      settings.currency
                    )}
                </div>
                <div
                  className={`${getAmountTextColor(findLastUpdate()?.return ?? 0)}`}
                >
                  {formatAsROIPercentage(findLastUpdate()?.roi ?? 0)} (
                  {settings &&
                    formatAmountInCentsAsCurrencyString(
                      findLastUpdate()?.return ?? 0,
                      settings.currency
                    )}
                  )
                </div>
              </div>

              <div>
                <button className="w-full lg:w-auto mb-2 border px-3 py-2 mr-4">
                  <Link href={`/investments/${params.id}/updates`}>
                    View updates
                  </Link>
                </button>
                <button className="w-full lg:w-auto mb-2 border px-3 py-2 mr-4">
                  <Link href={`/investments/${params.id}/transactions`}>
                    View transactions
                  </Link>
                </button>
                <button
                  className="w-full lg:w-auto border mb-2 px-3 py-2 mr-4 text-white bg-red-500 border-red-500"
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

            <h2 className="text-2xl font-bold mb-4">Performance</h2>

            {updateDataPoints.length === 0 && (
              <div>
                <p className="mb-4">There are no updates yet.</p>
                <p>Go to 'View updates' and click on 'Add update'.</p>
              </div>
            )}

            {updateDataPoints.length > 0 && (
              <div className="mb-4 flex gap-4 grid grid-cols-1 lg:grid-cols-3">
                <div className="aspect-square">
                  <h1 className="text-xl font-bold mb-4">
                    Principal and value
                  </h1>
                  <div className="w-full h-full">
                    {settings && (
                      <Line
                        options={principalAndValueLineOptions(
                          settings.currency
                        )}
                        data={buildPrincipalAndValueLineData(updateDataPoints)}
                      />
                    )}
                  </div>
                </div>

                <div className="aspect-square">
                  <h1 className="text-xl font-bold mb-4">Return</h1>
                  <div className="w-full h-full">
                    {settings && (
                      <Line
                        options={returnLineOptions(settings.currency)}
                        data={buildReturnLineData(updateDataPoints)}
                      />
                    )}
                  </div>
                </div>

                <div className="aspect-square">
                  <h1 className="text-xl font-bold mb-4">ROI</h1>
                  <div className="w-full h-full">
                    <Line
                      options={roiLineOptions}
                      data={buildROILineData(updateDataPoints)}
                    />
                  </div>
                </div>

                <div className="aspect-square">
                  <h1 className="text-xl font-bold mb-4">Monthly growth</h1>
                  <div className="w-full h-full">
                    {settings && (
                      <Bar
                        options={monthlyGrowthBarOptions(settings.currency)}
                        data={buildMonthlyGrowthBarData(
                          monthlyChangeDataPoints
                        )}
                      />
                    )}
                  </div>
                </div>

                <div className="aspect-square">
                  <h1 className="text-xl font-bold mb-4">Yearly growth</h1>
                  <div className="w-full h-full">
                    {settings && (
                      <Bar
                        options={yearlyGrowthBarOptions(settings.currency)}
                        data={buildYearlyGrowthBarData(yearlyChangeDataPoints)}
                      />
                    )}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </AppLayout>
  );
}

const buildPrincipalAndValueLineData = (updateRows: UpdateDataPoint[]) => {
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

const principalAndValueLineOptions = (currency: string) => ({
  maintainAspectRatio: false,
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
            label += formatAmountAsCurrencyString(context.parsed.y, currency);
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
          return formatAmountAsCurrencyString(value, currency);
        },
      },
    },
  },
});

const returnLineOptions = (currency: string) => ({
  maintainAspectRatio: false,
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
            label += formatAmountAsCurrencyString(context.parsed.y, currency);
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
          return formatAmountAsCurrencyString(value, currency);
        },
      },
    },
  },
});

export const monthlyGrowthBarOptions = (currency: string) => ({
  maintainAspectRatio: false,
  plugins: {
    tooltip: {
      callbacks: {
        label: function (context) {
          let label = context.dataset.label || "";
          if (label) {
            label += ": ";
          }
          if (context.parsed.y !== null) {
            label += formatAmountAsCurrencyString(context.parsed.y, currency);
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
          return formatAmountAsCurrencyString(value, currency);
        },
      },
    },
  },
});

export const yearlyGrowthBarOptions = (currency: string) => ({
  maintainAspectRatio: false,
  plugins: {
    tooltip: {
      callbacks: {
        label: function (context) {
          let label = context.dataset.label || "";
          if (label) {
            label += ": ";
          }
          if (context.parsed.y !== null) {
            label += formatAmountAsCurrencyString(context.parsed.y, currency);
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
          return formatAmountAsCurrencyString(value, currency);
        },
      },
    },
  },
});

const roiLineOptions: ChartOptions<"line"> = {
  maintainAspectRatio: false,
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
  id: string;
  date: string;
  principal: number;
  value: number;
  return: number;
  roi: number;
}

const buildReturnLineData = (updateDataPoints: UpdateDataPoint[]) => {
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
  monthlyChangeDataPoints: MonthlyDataPoint[]
): ChartData<"bar"> => {
  return {
    datasets: [
      {
        label: "Principal",
        borderColor: chartBackgroundColors[0],
        backgroundColor: chartBackgroundColors[0],
        data: monthlyChangeDataPoints.map((dataPoint) => ({
          x: dataPoint.yearMonth,
          y: dataPoint.principal / 100,
        })),
      },
      {
        label: "Return",
        borderColor: chartBackgroundColors[1],
        backgroundColor: chartBackgroundColors[1],
        data: monthlyChangeDataPoints.map((dataPoint) => ({
          x: dataPoint.yearMonth,
          y: dataPoint.return / 100,
        })),
      },
    ],
  };
};

export const buildYearlyGrowthBarData = (
  yearlyChangeDataPoints: YearlyChangeDataPoint[]
): ChartData<"bar"> => {
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