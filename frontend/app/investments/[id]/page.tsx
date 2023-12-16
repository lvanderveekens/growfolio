"use client"

import AppLayout from "@/app/app-layout";
import { api } from "@/app/axios";
import { Button } from "@/app/button";
import Dropdown from "@/app/dropdown";
import { useLocalStorage } from "@/app/localstorage";
import Modal from "@/app/modal";
import { DateRange, Investment, InvestmentUpdate, YearlyChangeDataPoint, calculateMonthlyChangeDataPoints, calculateYearlyChangeDataPoints, chartBackgroundColors, convertToDate, getAmountTextColor, valueLineData, valueLineOptions } from "@/app/portfolio-page";
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
import { FaCaretDown, FaCaretUp, FaChevronLeft } from "react-icons/fa6";
import { InvestmentIsLockedMessage } from "../investment-locked-message";
import { labelsByInvestmentType } from "@/app/investment-type";
import { MonthlyDataPoint, calculateMonthlyDataPoints, calculateMonthlyROI, calculateTimeWeightedReturn } from "@/app/data-points";

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
  // const [lastYearInvestmentUpdates, setLastYearInvestmentUpdates] = useState<InvestmentUpdate[]>([])

  const [updateDataPoints, setUpdateDataPoints] = useState<UpdateDataPoint[]>([])
  // const [lastYearUpdateDataPoints, setLastYearUpdateDataPoints] = useState<UpdateDataPoint[]>([])

  const [monthlyDataPoints, setMonthlyDataPoints] = useState<MonthlyDataPoint[]>([])
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
    const updateDataPoints = calculateUpdateDataPoints(investmentUpdates)
    setUpdateDataPoints(updateDataPoints);

    setMonthlyDataPoints(calculateMonthlyDataPoints(updateDataPoints));
    setMonthlyChangeDataPoints( calculateMonthlyChangeDataPoints(updateDataPoints));
    setYearlyChangeDataPoints(calculateYearlyChangeDataPoints(updateDataPoints));
  }, [investmentUpdates]);


  const calculateUpdateDataPoints = (investmentUpdates: InvestmentUpdate[]) => {
    const updateDataPoints = investmentUpdates.map((update) => {
      const cost = update.cost
      const value = update.value;
      const returnValue = value - cost;
      const roi = returnValue / cost;

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
    const dateFrom = convertToDate(selectedDateRange)?.toISOString()?.split("T")?.[0];
    api
      .get(`/investment-updates?investmentId=${params.id}`, { params: { ...(dateFrom && { dateFrom: dateFrom }) } })
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
            <Link className="mb-4 inline-block hover:underline underline-offset-4" href="/">
              <div className="flex items-center">
                <FaChevronLeft className="inline" />
                Back to Portfolio
              </div>
            </Link>

            <div className="mb-4">
              <h1 className="text-3xl sm:text-3xl font-bold">{investment.name}</h1>
            </div>

            {investment.locked && <InvestmentIsLockedMessage />}

            <div className="mb-4">
              <span className="font-bold">Last update: </span>
              <span>{investment.lastUpdateDate ?? "Never"}</span>
            </div>

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

            <div className="relative border bg-white text-center mb-4">
              <div className="z-10 relative py-[75px]">
                <div className="font-bold">Value</div>
                <div className="font-bold text-4xl">
                  {settings && formatAmountInCentsAsCurrencyString(lastUpdate?.value ?? 0, settings.currency)}
                </div>
                <div className={`${getAmountTextColor(lastUpdate?.return ?? 0)} flex items-center justify-center`}>
                  {(lastUpdate?.return ?? 0) > 0 && <FaCaretUp className="inline mr-1" />}
                  {(lastUpdate?.return ?? 0) < 0 && <FaCaretDown className="inline mr-1" />}
                  {settings && formatAmountInCentsAsCurrencyString(lastUpdate?.return ?? 0, settings.currency)} (
                  {formatAsROIPercentage(lastUpdate?.roi ?? 0)})
                </div>
              </div>
              <div className="absolute left-0 top-0 w-full h-full ">
                {settings && (
                  <Line options={valueLineOptions(settings.currency)} data={valueLineData(updateDataPoints)} />
                )}
              </div>
            </div>

            <div className="">
              <Button
                className="w-full lg:w-auto mb-4 mr-4"
                variant="secondary"
                onClick={() => router.push(`/investments/${params.id}/updates`)}
              >
                View updates
              </Button>
              <Button
                className="w-full lg:w-auto mb-4 mr-4"
                variant="danger"
                onClick={() => setShowDeleteInvestmentModal(true)}
              >
                Delete investment
              </Button>
              {showDeleteInvestmentModal && (
                <Modal title="Delete investment" onClose={() => setShowDeleteInvestmentModal(false)}>
                  Are you sure?
                  <div className="mt-4 flex gap-4 justify-between lg:justify-end">
                    <Button
                      className="w-full lg:w-auto"
                      variant="secondary"
                      onClick={() => setShowDeleteInvestmentModal(false)}
                    >
                      Cancel
                    </Button>
                    <Button className="w-full lg:w-auto" variant="danger" onClick={deleteInvestment}>
                      Delete
                    </Button>
                  </div>
                </Modal>
              )}
            </div>

            <h2 className="text-2xl font-bold mb-4">Performance</h2>

            {updateDataPoints.length === 0 && (
              <>
                <div className="mb-4">There are no investment updates yet.</div>
                <div className="mb-4">Click on 'View updates' to get started.</div>
              </>
            )}

            {updateDataPoints.length > 0 && (
              <>
                <div className="mb-4 flex gap-4 grid grid-cols-1 lg:grid-cols-3">
                  <div className="aspect-square bg-white p-4 border">
                    <h1 className="font-bold mb-4">Cost vs value</h1>
                    <div className="w-full h-full">
                      {settings && (
                        <Line
                          options={costVsValueLineOptions(settings.currency)}
                          data={buildCostVsValueLineData(updateDataPoints)}
                        />
                      )}
                    </div>
                  </div>

                  <div className="aspect-square bg-white p-4 border">
                    <h1 className="font-bold mb-4">Monthly cost</h1>
                    <div className="w-full h-full">
                      {settings && (
                        <Bar
                          options={monthlyChangeBarOptions(settings.currency)}
                          data={buildMonthlyCostBarData(monthlyChangeDataPoints)}
                        />
                      )}
                    </div>
                  </div>

                  <div className="aspect-square bg-white p-4 border">
                    <h3 className="font-bold mb-4">Yearly cost</h3>

                    <div className="w-full h-full">
                      {settings && (
                        <Bar
                          options={yearlyChangeBarOptions(settings.currency)}
                          data={buildYearlyCostBarData(yearlyChangeDataPoints)}
                        />
                      )}
                    </div>
                  </div>

                  <div className="aspect-square bg-white p-4 border">
                    <h1 className="font-bold mb-4">Return</h1>
                    <div className="w-full h-full">
                      {settings && (
                        <Line
                          options={returnLineOptions(settings.currency)}
                          data={buildReturnLineData(updateDataPoints)}
                        />
                      )}
                    </div>
                  </div>

                  <div className="aspect-square bg-white p-4 border">
                    <h1 className="font-bold mb-4">Monthly return</h1>
                    <div className="w-full h-full">
                      {settings && (
                        <Bar
                          options={monthlyChangeBarOptions(settings.currency)}
                          data={buildMonthlyReturnBarData(monthlyDataPoints)}
                        />
                      )}
                    </div>
                  </div>

                  <div className="aspect-square bg-white p-4 border">
                    <h3 className="font-bold mb-4">Yearly return</h3>

                    <div className="w-full h-full">
                      {settings && (
                        <Bar
                          options={yearlyChangeBarOptions(settings.currency)}
                          data={buildYearlyReturnBarData(yearlyChangeDataPoints)}
                        />
                      )}
                    </div>
                  </div>

                  <div className="aspect-square bg-white p-4 border">
                    <h1 className="font-bold mb-4">ROI</h1>
                    <div className="w-full h-full">
                      <Line options={roiLineOptions} data={buildROILineData(updateDataPoints)} />
                    </div>
                  </div>

                  <div className="aspect-square bg-white p-4 border">
                    <h1 className="font-bold mb-4">Monthly ROI</h1>
                    <div className="w-full h-full">
                      {settings && (
                        <Bar options={monthlyROIBarOptions()} data={buildMonthlyROIBarData(monthlyDataPoints)} />
                      )}
                    </div>
                  </div>

                  <div className="aspect-square bg-white p-4 border">
                    <h3 className="font-bold mb-4">Yearly ROI</h3>

                    <div className="w-full h-full">
                      {settings && (
                        <Bar options={yearlyROIBarOptions()} data={buildYearlyROIBarData(monthlyDataPoints)} />
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

export const monthlyROIBarOptions = () => ({
  maintainAspectRatio: false,
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
            label += formatAsROIPercentage(context.parsed.y);
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
          return formatAsROIPercentage(value);
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

export const yearlyROIBarOptions = () => ({
  maintainAspectRatio: false,
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
            label += formatAsROIPercentage(context.parsed.y);
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
          return formatAsROIPercentage(value);
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
  roi: number;
}

const buildReturnLineData = (updateDataPoints: UpdateDataPoint[]) => {
  return {
    datasets: [
      {
        label: "Return",
        borderColor: chartBackgroundColors[2],
        backgroundColor: chartBackgroundColors[2],
        data: updateDataPoints.map((x) => ({
          x: x.date,
          y: (x.value - x.cost) / 100,
        })),
      },
    ],
  };
};

export const buildMonthlyCostBarData = (
  monthlyChangeDataPoints: MonthlyChangeDataPoint[]
): ChartData<"bar"> => {
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
      // {
      //   label: "Return",
      //   borderColor: chartBackgroundColors[1],
      //   backgroundColor: chartBackgroundColors[1],
      //   data: monthlyChangeDataPoints.map((dataPoint) => ({
      //     x: dataPoint.yearMonth,
      //     y: dataPoint.return / 100,
      //   })),
      // },
    ],
  };
};

export const buildMonthlyReturnBarData = (
  monthlyDataPoints: MonthlyDataPoint[]
): ChartData<"bar"> => {
  return {
    datasets: [
      {
        label: "Return",
        borderColor: chartBackgroundColors[2],
        backgroundColor: chartBackgroundColors[2],
        data: monthlyDataPoints.map((dataPoint) => ({
          x: dataPoint.yearMonth,
          y: ((dataPoint.endingValue - dataPoint.netDeposits) - dataPoint.startingValue) / 100,
        })),
      },
    ],
  };
};

export const buildMonthlyReturnChangeBarData = (
  monthlyChangeDataPoints: MonthlyChangeDataPoint[]
): ChartData<"bar"> => {
  return {
    datasets: [
      {
        label: "Return change",
        borderColor: chartBackgroundColors[2],
        backgroundColor: chartBackgroundColors[2],
        data: monthlyChangeDataPoints.map((dataPoint) => ({
          x: dataPoint.yearMonth,
          y: dataPoint.return / 100,
        })),
      },
    ],
  };
};

export const buildMonthlyROIBarData = (
  monthlyDataPoints: MonthlyDataPoint[]
): ChartData<"bar"> => {
  return {
    datasets: [
      {
        label: "ROI",
        borderColor: chartBackgroundColors[4],
        backgroundColor: chartBackgroundColors[4],
        data: monthlyDataPoints.map((monthlyDataPoint) => ({
          x: monthlyDataPoint.yearMonth,
          y: calculateMonthlyROI(monthlyDataPoint),
        })),
      },
    ],
  };
};


export const buildMonthlyROIChangeBarData = (
  monthlyChangeDataPoints: MonthlyChangeDataPoint[]
): ChartData<"bar"> => {
  return {
    datasets: [
      {
        label: "ROI change",
        borderColor: chartBackgroundColors[4],
        backgroundColor: chartBackgroundColors[4],
        data: monthlyChangeDataPoints.map((dataPoint) => ({
          x: dataPoint.yearMonth,
          y: dataPoint.roi,
        })),
      },
    ],
  };
};

export const buildYearlyReturnBarData = (
  yearlyChangeDataPoints: YearlyChangeDataPoint[]
): ChartData<"bar"> => {
  return {
    datasets: [
      {
        label: "Return",
        borderColor: chartBackgroundColors[2],
        backgroundColor: chartBackgroundColors[2],
        data: yearlyChangeDataPoints.map((dataPoint) => ({
          x: dataPoint.year,
          y: dataPoint.return / 100,
        })),
      },
    ],
  };
};

export const buildYearlyROIBarData = (
  monthlyDataPoints: MonthlyDataPoint[]
): ChartData<"bar"> => {
  const monthlyDataPointsByYear = groupByYear(monthlyDataPoints)
  return {
    datasets: [
      {
        label: "ROI",
        borderColor: chartBackgroundColors[4],
        backgroundColor: chartBackgroundColors[4],
        data: Array.from(monthlyDataPointsByYear.entries()).map(([key, value]) => ({
          x: key,
          y: calculateTimeWeightedReturn(value),
        })),
      },
    ],
  };
};

const groupByYear = (monthlyDataPoints: MonthlyDataPoint[]) => {
  return monthlyDataPoints.reduce((map, obj) => {
    console.log(obj)
    const year = obj.yearMonth.split('-')[0];
    if (!map.has(year)) {
      map.set(year, []);
    }
    map.get(year)!.push(obj);
    return map;
  }, new Map<string, MonthlyDataPoint[]>());
};

export const buildYearlyCostBarData = (
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
      // {
      //   label: "Return",
      //   borderColor: chartBackgroundColors[1],
      //   backgroundColor: chartBackgroundColors[1],
      //   data: yearlyChangeDataPoints.map((dataPoint) => ({
      //     x: dataPoint.year,
      //     y: dataPoint.return / 100,
      //   })),
      // },
    ],
  };
};

const buildROILineData = (updateDataPoints: UpdateDataPoint[]) => {
  return {
    datasets: [
      {
        label: "ROI",
        borderColor: chartBackgroundColors[4],
        backgroundColor: chartBackgroundColors[4],
        data: updateDataPoints.map((x) => ({
          x: x.date,
          y: (((x.value - x.cost) / x.cost) * 100).toFixed(2),
        })),
      },
    ],
  };
};