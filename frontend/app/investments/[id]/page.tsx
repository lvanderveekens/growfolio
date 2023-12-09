"use client"

import AppLayout from "@/app/app-layout";
import { api } from "@/app/axios";
import { Button } from "@/app/button";
import Dropdown from "@/app/dropdown";
import { useLocalStorage } from "@/app/localstorage";
import Modal from "@/app/modal";
import { DateRange, Investment, InvestmentUpdate, YearlyChangeDataPoint, calculateMonthlyChangeDataPoints, calculateYearlyChangeDataPoints, chartBackgroundColors, convertToDate, getAmountTextColor } from "@/app/overview-page";
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
import { FaChevronLeft } from "react-icons/fa6";
import { InvestmentIsLockedMessage } from "../investment-locked-message";

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

  const [investmentUpdates, setInvestmentUpdates] = useState<InvestmentUpdate[]>([])

  const [updateDataPoints, setUpdateDataPoints] = useState<UpdateDataPoint[]>([])
  const [monthlyChangeDataPoints, setMonthlyChangeDataPoints] = useState<MonthlyChangeDataPoint[]>([])
  const [yearlyChangeDataPoints, setYearlyChangeDataPoints] = useState<YearlyChangeDataPoint[]>([])

  const [showDeleteInvestmentModal, setShowDeleteInvestmentModal] = useState<boolean>(false);

  const router = useRouter()

  const [selectedDateRange, setSelectedDateRange] = useLocalStorage<DateRange>("growfolio-selected-date-range", DateRange.ANY_TIME)

  const [settings, setSettings] = useState<Settings>();

  useEffect(() => {
    fetchInvestment()
    fetchInvestmentUpdates()
    fetchSettings()
  }, [selectedDateRange]);

  useEffect(() => {
    const updateDataPoints = calculateUpdateDataPoints()
    setUpdateDataPoints(updateDataPoints);

    setMonthlyChangeDataPoints(
      calculateMonthlyChangeDataPoints(updateDataPoints)
    );
    setYearlyChangeDataPoints(
      calculateYearlyChangeDataPoints(updateDataPoints)
    );
  }, [investmentUpdates]);


  const calculateUpdateDataPoints = () => {
    const updateDataPoints = investmentUpdates.map((update) => {
      const cost = update.cost
      const value = update.value;

      let returnValue = 0;
      let roi = 0;

      if (value && cost) {
        returnValue = value - cost;
        roi = returnValue / cost;
      }

      return {
        id: update.id,
        date: update.date,
        cost: cost,
        value: value,
        return: returnValue,
        roi: roi,
      } as UpdateDataPoint;
    });
    return updateDataPoints
  }

  const fetchInvestment = () => {
    api.get(`/investments/${params.id}`)
      .then((res) => setInvestment(res.data))
      .catch((error) => {
        console.error(`Error fetching investment: ${error}`);
        setError(error)
      })
      .finally(() => setLoading(false));
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
      .then((res) => setInvestmentUpdates(res.data));
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

  const lastUpdate = findLastUpdate()

  return (
    <AppLayout>
      <div className="container my-4">
        {loading && <p>Loading...</p>}
        {error && <p>Error: ${error}</p>}
        {investment && (
          <>
            <Link className="mb-4 inline-block" href="/">
              <div className="flex items-center">
                <FaChevronLeft className="inline" />
                Back to Overview
              </div>
            </Link>

            <div className="mb-4">
              <h1 className="text-3xl sm:text-3xl font-bold">
                {investment.name}
              </h1>
            </div>

            {investment.locked && <InvestmentIsLockedMessage />}

            <div className="mb-4">
              Last update: {investment.lastUpdateDate ?? "Never"}
            </div>

            <div className="border bg-white py-[75px] text-center mb-4">
              <div className="font-bold text-3xl">
                {settings &&
                  formatAmountInCentsAsCurrencyString(
                    lastUpdate?.value ?? 0,
                    settings.currency
                  )}
              </div>
              <div className={`${getAmountTextColor(lastUpdate?.return ?? 0)}`}>
                {formatAsROIPercentage(lastUpdate?.roi ?? 0)} (
                {settings &&
                  formatAmountInCentsAsCurrencyString(
                    lastUpdate?.return ?? 0,
                    settings.currency
                  )}
                )
              </div>
            </div>

            <div>
              <Button
                className="w-full lg:w-auto mb-4 mr-4"
                variant="secondary"
                onClick={() => router.push(`/investments/${params.id}/updates`)}
              >
                Manage updates
              </Button>
              <Button
                className="w-full lg:w-auto mb-4 mr-4"
                variant="danger"
                onClick={() => setShowDeleteInvestmentModal(true)}
              >
                Delete investment
              </Button>
              {showDeleteInvestmentModal && (
                <Modal
                  title="Delete investment"
                  onClose={() => setShowDeleteInvestmentModal(false)}
                >
                  Are you sure?
                  <div className="mt-4 flex gap-4 justify-between lg:justify-end">
                    <Button
                      className="w-full lg:w-auto"
                      variant="secondary"
                      onClick={() => setShowDeleteInvestmentModal(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      className="w-full lg:w-auto"
                      variant="danger"
                      onClick={deleteInvestment}
                    >
                      Delete
                    </Button>
                  </div>
                </Modal>
              )}
            </div>

            <h2 className="text-2xl font-bold mb-4">Performance</h2>

            {updateDataPoints.length === 0 && (
              <div>There are no data points yet.</div>
            )}

            {updateDataPoints.length > 0 && (
              <>
                <div className="mb-4">
                  <Dropdown
                    className="w-full lg:w-auto"
                    dropdownClassName="w-full lg:w-[180px]"
                    selected={{
                      label: selectedDateRange,
                      value: selectedDateRange,
                    }}
                    onChange={(option) => setSelectedDateRange(option.value)}
                    options={Object.values(DateRange).map((dateRange) => ({
                      label: dateRange,
                      value: dateRange,
                    }))}
                  />
                </div>
                <div className="mb-4 flex gap-4 grid grid-cols-1 lg:grid-cols-3">
                  <div className="aspect-square">
                    <h1 className="text-xl font-bold mb-4">
                      Cost vs value
                    </h1>
                    <div className="w-full h-full">
                      {settings && (
                        <Line
                          options={costVsValueLineOptions(
                            settings.currency
                          )}
                          data={buildCostVsValueLineData(updateDataPoints)}
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
                    <h1 className="text-xl font-bold mb-4">Monthly change</h1>
                    <div className="w-full h-full">
                      {settings && (
                        <Bar
                          options={monthlyChangeBarOptions(settings.currency)}
                          data={buildMonthlyChangeBarData(
                            monthlyChangeDataPoints
                          )}
                        />
                      )}
                    </div>
                  </div>

                  <div className="aspect-square">
                    <h1 className="text-xl font-bold mb-4">Yearly change</h1>
                    <div className="w-full h-full">
                      {settings && (
                        <Bar
                          options={yearlyChangeBarOptions(settings.currency)}
                          data={buildYearlyChangeBarData(
                            yearlyChangeDataPoints
                          )}
                        />
                      )}
                    </div>
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </AppLayout>
  );
}

const buildCostVsValueLineData = (updateRows: UpdateDataPoint[]) => {
  return {
    datasets: [
      {
        label: "Cost",
        borderColor: chartBackgroundColors[0],
        backgroundColor: chartBackgroundColors[0],
        data: updateRows.map((x) => ({
          x: x.date,
          y: x.cost / 100,
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

const costVsValueLineOptions = (currency: string) => ({
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

export const monthlyChangeBarOptions = (currency: string) => ({
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

export const yearlyChangeBarOptions = (currency: string) => ({
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
  cost: number;
  value: number;
  return: number;
  roi: number;
}

interface MonthlyChangeDataPoint {
  yearMonth: string;
  value: number;
  cost: number;
  return: number;
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
          y: (x.value - x.cost) / 100,
        })),
      },
    ],
  };
};

export const buildMonthlyChangeBarData = (
  monthlyChangeDataPoints: MonthlyChangeDataPoint[]
): ChartData<"bar"> => {
  console.log("building monthly change bar data")
  return {
    datasets: [
      {
        label: "Cost",
        borderColor: chartBackgroundColors[0],
        backgroundColor: chartBackgroundColors[0],
        data: monthlyChangeDataPoints.map((dataPoint) => ({
          x: dataPoint.yearMonth,
          y: dataPoint.cost / 100,
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

export const buildYearlyChangeBarData = (
  yearlyChangeDataPoints: YearlyChangeDataPoint[]
): ChartData<"bar"> => {
  return {
    datasets: [
      {
        label: "Cost",
        borderColor: chartBackgroundColors[0],
        backgroundColor: chartBackgroundColors[0],
        data: yearlyChangeDataPoints.map((dataPoint) => ({
          x: dataPoint.year,
          y: dataPoint.cost / 100,
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
          y: (((x.value - x.cost) / x.cost) * 100).toFixed(2),
        })),
      },
    ],
  };
};