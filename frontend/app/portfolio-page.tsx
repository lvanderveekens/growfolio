"use client";

import { useEffect, useState } from "react";
import { InvestmentType, labelsByInvestmentType } from "./investment-type";
import AddInvestmentForm from "./investments/add-investment-form";

import {
  ArcElement,
  CategoryScale,
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
import Link from "next/link";
import { Bar, Line, Pie } from "react-chartjs-2";
import { BiLockAlt } from 'react-icons/bi';
import ClipLoader from "react-spinners/ClipLoader";
import AppLayout from "./app-layout";
import { api } from "./axios";
import { Button } from "./button";
import { calculateCostForDate, calculateValueForDate } from "./calculator";
import Dropdown from "./dropdown";
import { buildMonthlyChangeBarData, buildYearlyChangeBarData, monthlyChangeBarOptions, yearlyChangeBarOptions } from "./investments/[id]/page";
import { useLocalStorage } from "./localstorage";
import Modal from "./modal";
import { Settings } from "./settings/settings";
import { capitalize, formatAmountAsCurrencyString, formatAmountInCentsAsCurrencyString, formatAsROIPercentage } from "./string";
import { createCheckoutSession } from "./stripe/client";
import { FaCaretDown, FaCaretUp } from "react-icons/fa6";


ChartJS.register(
  CategoryScale,
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

export default function PortfolioPage() {
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [investmentUpdates, setInvestmentUpdates] = useState<InvestmentUpdate[]>([]);
  const [investmentRows, setInvestmentRows] = useState<InvestmentRow[]>([]);
  
  const [updateDataPoints, setUpdateDataPoints] = useState<UpdateDataPoint[]>([]);
  const [monthlyChangeDataPoints, setMonthlyChangeDataPoints] = useState<MonthlyChangeDataPoint[]>([]);
  const [yearlyChangeDataPoints, setYearlyChangeDataPoints] = useState<YearlyChangeDataPoint[]>([]);
  
  const [selectedDateRange, setSelectedDateRange] = useLocalStorage<DateRange>("growfolio-selected-date-range", DateRange.ANY_TIME)
  
  const [loading, setLoading] = useState(true); 

  const [settings, setSettings] = useState<Settings>();

  const [user, setUser] = useState<User>();

  useEffect(() => {
    Promise.all([
      fetchInvestments(),
      fetchInvestmentUpdates(),
      fetchSettings(),
      fetchUser(),
    ]).finally(() => setLoading(false));
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

    if (investments.length > 0) {
      const investmentRows = investments.map((i) => {
        const investmentUpdatesForInvestment = investmentUpdates.filter((tx) => tx.investmentId == i.id);
        let lastUpdateForInvestment = null;
        if (investmentUpdatesForInvestment.length > 0) {
          lastUpdateForInvestment = investmentUpdatesForInvestment[investmentUpdatesForInvestment.length - 1];
        }

        const value = lastUpdateForInvestment?.value ?? 0;
        const cost = lastUpdateForInvestment?.cost ?? 0;

        let returnValue = 0
        let roi = 0

        if (value && cost) {
          returnValue = value - cost
          roi = returnValue / cost;
        }

        return {
          id: i.id,
          name: i.name,
          type: i.type,
          lastUpdateDate: i.lastUpdateDate,
          cost: cost,
          value: value,
          return: returnValue,
          roi: roi,
          locked: i.locked,
        } as InvestmentRow;
      });

      setInvestmentRows(investmentRows);
    }
  }, [investments, investmentUpdates]);

  const calculateUpdateDataPoints = () => {
    const uniqueUpdateDates = Array.from(
      new Set(investmentUpdates.map((update) => update.date))
    );

    return uniqueUpdateDates.map((date) => {
      const value = calculateValueForDate(date, investmentUpdates);
      const cost = calculateCostForDate(date, investmentUpdates);
      const returnValue = value - cost;
      const roi = returnValue / cost;

      return {
        date: date,
        value: value,
        cost: cost,
        return: returnValue,
        roi: roi,
      } as UpdateDataPoint;
    });
  }

  const fetchUser = async () => {
    api.get("/user")
      .then((res) => {
        if (res.status === 200) {
          setUser(res.data);
        }
      })
  };

  const fetchInvestments = async () => {
    api
      .get(`/investments`)
      .then((res) => {
        setInvestments(res.data);
      });
  };

  const fetchInvestmentUpdates = async () => {
    const dateFrom = convertToDate(selectedDateRange)
      ?.toISOString()
      ?.split("T")
      ?.[0]

    api.get(`/investment-updates`, {
        params: {
          ...(dateFrom && { dateFrom: dateFrom }), 
        },
      }
    )
    .then((res) => setInvestmentUpdates(res.data));
  };

  const fetchSettings = async () => {
    api.get(`/settings`).then((res) => {
      setSettings(res.data);
    });
  };

  const buildCostVsValueLineData = (
    updateDataPoints: UpdateDataPoint[]
  ) => {
    return {
      datasets: [
        {
          label: "Cost",
          borderColor: chartBackgroundColors[0],
          backgroundColor: chartBackgroundColors[0],
          data: updateDataPoints.map((x) => ({
            x: x.date,
            y: x.cost / 100,
          })),
        },
        {
          label: "Value",
          borderColor: chartBackgroundColors[1],
          backgroundColor: chartBackgroundColors[1],
          data: updateDataPoints.map((x) => ({
            x: x.date,
            y: x.value / 100,
          })),
        },
      ],
    };
  };

  const valueLineData = (
    updateDataPoints: UpdateDataPoint[]
  ) => {
    return {
      datasets: [
        {
          label: "Value",
          borderColor: "#e5e7eb", // same color as default tailwind 'border' class
          pointStyle: false,
          data: updateDataPoints.map((x) => ({
            x: x.date,
            y: x.value / 100,
          })),
        },
      ],
    };
  };

  const buildReturnLineData = (
    dateWithCostAndValue: UpdateDataPoint[]
  ) => {
    return {
      datasets: [
        {
          label: "Return",
          borderColor: chartBackgroundColors[0],
          backgroundColor: chartBackgroundColors[0],
          data: dateWithCostAndValue.map((x) => ({
            x: x.date,
            y: (x.value - x.cost) / 100,
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
          borderColor: chartBackgroundColors[0],
          backgroundColor: chartBackgroundColors[0],
          data: updateDataPoints.map((x) => {
            return {
              x: x.date,
              y: x.roi,
            }
          }),
        },
      ],
    };
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


            if (context.parsed !== null) {
              const valueString = settings && formatAmountInCentsAsCurrencyString(context.parsed, settings.currency);
              const totalValuePercentage = formatAsROIPercentage(
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
          backgroundColor: chartBackgroundColors,
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
          backgroundColor: chartBackgroundColors,
          data: investmentTypeWithValues.map((i) => {
            return i.value;
          }) 
        },
      ],
    };
  };

  const totalCost = investmentRows.reduce(
    (acc, row) => acc + (row.cost ?? 0),
    0
  );
  const totalValue = investmentRows.reduce((acc, row) => acc + (row.value ?? 0), 0);
  const totalReturn = totalValue - totalCost;
  const totalRoi = totalReturn / totalCost;

  const [showAddInvestmentModal, setShowAddInvestmentModal] =
    useState<boolean>(false);

  const renderInvestment = (investmentRow: InvestmentRow) => {
    if (!settings) {
      return 
    }

    return (
      <div className="">
        <div className="font-bold flex justify-between">
          <div>{investmentRow.name}</div>
          <div>{formatAmountInCentsAsCurrencyString(investmentRow.value, settings.currency)}</div>
        </div>
        <div className="flex justify-between">
          <div>Type</div>
          <div>{labelsByInvestmentType[investmentRow.type]}</div>
        </div>
        <div className="flex justify-between">
          <div>Return</div>
          <div className={`${getAmountTextColor(investmentRow.roi ?? 0)} flex items-center`}>
            {investmentRow.return > 0 && <FaCaretUp className="inline mr-1" />}
            {investmentRow.return < 0 && <FaCaretDown className="inline mr-1" />}
            {formatAmountInCentsAsCurrencyString(investmentRow.return, settings.currency)} (
            {formatAsROIPercentage(investmentRow.roi)})
          </div>
        </div>
        <div className="flex justify-between">
          <div>Last update</div>
          <div>{investmentRow.lastUpdateDate ?? "Never"}</div>
        </div>
      </div>
    );
  }

  const lastUpdateDate = getLastUpdateDate(investmentRows)

  return (
    <AppLayout>
      <main>
        <div className="container my-4">
          <div className="mb-4">
            <h1 className="text-3xl sm:text-3xl font-bold mb-4">Portfolio</h1>

            <div className="mb-4">Last update: {lastUpdateDate ?? "Never"}</div>

            <div className="relative border bg-white text-center mb-4">
              <div className="z-10 relative py-[75px]">
                <div className="font-bold">Value</div>
                <div className="font-bold text-4xl">
                  {settings && formatAmountInCentsAsCurrencyString(totalValue, settings.currency)}
                </div>
                <div className={`${getAmountTextColor(totalReturn)} flex justify-center items-center`}>
                  {totalReturn > 0 && <FaCaretUp className="inline mr-1" />}
                  {totalReturn < 0 && <FaCaretDown className="inline mr-1" />}
                  {settings && formatAmountInCentsAsCurrencyString(totalReturn, settings.currency)} (
                  {formatAsROIPercentage(totalRoi)})
                </div>
              </div>
              <div className="absolute left-0 top-0 w-full h-full ">
                {settings && (
                  <Line options={valueLineOptions(settings.currency)} data={valueLineData(updateDataPoints)} />
                )}
              </div>
            </div>

            <h2 className="text-2xl font-bold mb-4">My investments</h2>

            {loading && (
              <div className="mb-4">
                <ClipLoader size={28} aria-label="Loading Spinner" data-testid="loader" />
              </div>
            )}
            {!loading && investmentRows.length === 0 && <div className="mb-4">There are no investments yet.</div>}
            {!loading && investmentRows.length > 0 && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
                {investmentRows.map((investmentRow) => {
                  return (
                    <Link
                      className="bg-white border hover:bg-gray-100 p-4"
                      key={investmentRow.id}
                      href={`/investments/${investmentRow.id}`}
                    >
                      {investmentRow.locked ? (
                        <div key={investmentRow.id} className="relative h-full">
                          <div className="absolute w-full h-full bg-white opacity-60"></div>
                          <div className="absolute w-full h-full flex items-center justify-center">
                            <BiLockAlt size={32} />
                          </div>
                          {renderInvestment(investmentRow)}
                        </div>
                      ) : (
                        renderInvestment(investmentRow)
                      )}
                    </Link>
                  );
                })}
              </div>
            )}

            <Button
              className="mb-4 w-full sm:w-auto"
              variant="primary"
              type="submit"
              onClick={() => {
                setShowAddInvestmentModal(true);
              }}
            >
              Add investment
            </Button>
            {showAddInvestmentModal && (
              <Modal title="Add investment" onClose={() => setShowAddInvestmentModal(false)}>
                {user?.accountType === AccountType.BASIC && investments.length >= 2 ? (
                  <div>
                    <div>
                      You've reached the limit of 2 investments for a Basic account. Upgrade to Premium to track
                      unlimited investments.
                    </div>
                    {user && user.accountType == AccountType.BASIC && (
                      <div className="mt-4">
                        <Button className="w-full sm:w-auto" variant="primary" onClick={createCheckoutSession}>
                          Upgrade to Premium
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  <AddInvestmentForm currency={settings!!.currency} />
                )}
              </Modal>
            )}
          </div>

          <h2 className="text-2xl font-bold mb-4">Performance</h2>

          {updateDataPoints.length === 0 && <div>There are no data points yet.</div>}

          {updateDataPoints.length > 0 && (
            <>
              <div className="mb-4">
                <Dropdown
                  className="lg:w-auto"
                  dropdownClassName="lg:w-[180px]"
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
                  <h3 className="font-bold mb-4">Allocation</h3>
                  <div className="w-full h-full">
                    <Pie options={allocationPieOptions} data={calculateAllocationPieData(investments)} />
                  </div>
                </div>
                <div className="aspect-square">
                  <h3 className="font-bold mb-4">Allocation by type</h3>
                  <div className="w-full h-full">
                    <Pie options={allocationPieOptions} data={calculateAllocationByTypePieData(investments)} />
                  </div>
                </div>

                <div className="aspect-square">
                  <h3 className="font-bold mb-4">Cost vs value</h3>

                  <div className="w-full h-full">
                    {settings && (
                      <Line
                        options={costVsValueLineOptions(settings.currency)}
                        data={buildCostVsValueLineData(updateDataPoints)}
                      />
                    )}
                  </div>
                </div>
                <div className="aspect-square">
                  <h3 className="font-bold mb-4">ROI</h3>

                  <div className="w-full h-full">
                    <Line options={roiLineOptions} data={buildROILineData(updateDataPoints)} />
                  </div>
                </div>
                <div className="aspect-square">
                  <h3 className="font-bold mb-4">Return</h3>

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
                  <h3 className="font-bold mb-4">Monthly change</h3>
                  <div className="w-full h-full">
                    {settings && (
                      <Bar
                        options={monthlyChangeBarOptions(settings.currency)}
                        data={buildMonthlyChangeBarData(monthlyChangeDataPoints)}
                      />
                    )}
                  </div>
                </div>
                <div className="aspect-square">
                  <h3 className="font-bold mb-4">Yearly change</h3>

                  <div className="w-full h-full">
                    {settings && (
                      <Bar
                        options={yearlyChangeBarOptions(settings.currency)}
                        data={buildYearlyChangeBarData(yearlyChangeDataPoints)}
                      />
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </AppLayout>
  );
}

export const costVsValueLineOptions = (currency: string) => ({
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
        tooltipFormat: 'YYYY-MM-DD' 
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

export const valueLineOptions = (currency: string) => ({
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
      enabled: false
    }
  },
  scales: {
    y: {
      display: false
    },
    y2: {
      display: false
    },
    x: {
      display: false
    }
  }
});

export const returnLineOptions = (currency: string) => ({
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
        tooltipFormat: 'YYYY-MM-DD' 
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

export const roiLineOptions: ChartOptions = {
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
            label += formatAsROIPercentage(context.parsed.y);
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
        tooltipFormat: 'YYYY-MM-DD' 
      },
    },
    y: {
      ticks: {
        callback: function (value: any, index: any, ticks: any) {
          return formatAsROIPercentage(value);
        },
      },
    },
  },
};

export interface User {
  id: string;
  email: string;
  provider: string;
  accountType: AccountType;
}

export enum AccountType {
  BASIC = "basic",
  PREMIUM = "premium",
}

export function getAccountTypeLabel(accountType: AccountType): string {
  switch(accountType) {
      case AccountType.BASIC:
        return "Basic";
      case AccountType.PREMIUM:
        return "Premium"
      default:
        return accountType
  }
}

export interface Investment {
  id: string;
  type: InvestmentType;
  name: string;
  locked: boolean;
  lastUpdateDate?: string;
}

export interface InvestmentUpdate {
  id: string;
  investmentId: string;
  date: string;
  deposit?: number;
  withdrawal?: number;
  cost: number;
  value: number;
}

export interface InvestmentRow {
  id: string;
  name: string;
  type: InvestmentType;
  lastUpdateDate?: string;
  cost: number;
  value: number;
  return: number;
  roi?: number;
  locked: boolean;
}

export interface UpdateDataPoint {
  date: string;
  cost: number;
  value: number;
  return: number;
  roi: number;
}

export interface MonthlyChangeDataPoint {
  yearMonth: string;
  value: number;
  cost: number;
  return: number;
}

export interface YearlyChangeDataPoint {
  year: string;
  value: number;
  cost: number;
  return: number;
}

export const chartBackgroundColors = [
  "rgb(255, 99, 132)",
  "rgb(54, 162, 235)",
  "rgb(255, 205, 86)",
  "rgb(255, 86, 205)",
  "rgb(87, 255, 205)",
];

export const calculateYearlyChangeDataPoints = (
  updateDataPoints: UpdateDataPoint[]
) => {
  const firstAndLastUpdatesByYear = new Map<
    string,
    [UpdateDataPoint, UpdateDataPoint]
  >();

  let currentYear: string | null = null;
  let firstUpdateOfYear: UpdateDataPoint | null = null;

  for (const updateDataPoint of updateDataPoints) {
    const year = updateDataPoint.date.substr(0, 4);
    if (year !== currentYear) {
      currentYear = year;
      firstUpdateOfYear = updateDataPoint;
    } else {
      firstAndLastUpdatesByYear.set(year, [
        firstUpdateOfYear!!,
        updateDataPoint,
      ]);
    }
  }

  const dataPoints: YearlyChangeDataPoint[] = [];
  const firstAndLastUpdatesByYearEntries = Array.from(
    firstAndLastUpdatesByYear.entries()
  );

  for (let i = 1; i < firstAndLastUpdatesByYearEntries.length; i++) {
    const previousYear = firstAndLastUpdatesByYearEntries[i - 1];
    const currentYear = firstAndLastUpdatesByYearEntries[i];

    if (i == 1) {
      // add first year
      dataPoints.push({
        year: previousYear[0],
        value: previousYear[1][1].value - previousYear[1][0].value,
        cost: previousYear[1][1].cost - previousYear[1][0].cost,
        return: previousYear[1][1].return - previousYear[1][0].return,
      });
    }

    dataPoints.push({
      year: currentYear[0],
      value: currentYear[1][1].value - previousYear[1][1].value,
      cost: currentYear[1][1].cost - previousYear[1][1].cost,
      return: currentYear[1][1].return - previousYear[1][1].return,
    });
  }
  return dataPoints;
}; 

export enum DateRange {
  ANY_TIME = "Any time",
  LAST_MONTH = "Last month",
  LAST_3_MONTHS = "Last 3 months",
  LAST_6_MONTHS = "Last 6 months",
  LAST_YEAR = "Last year",
  LAST_2_YEARS = "Last 2 years",
  LAST_5_YEARS = "Last 5 years",
  LAST_10_YEARS = "Last 10 years",
}

export function convertToDate(range: DateRange): Date | null {
  const today = new Date();
  var minusDays: number | null = null

  switch (range) {
    case DateRange.LAST_MONTH:
      minusDays = 30
      break;
    case DateRange.LAST_3_MONTHS:
      minusDays = 3 * 30
      break;
    case DateRange.LAST_6_MONTHS:
      minusDays = 6 * 30
      break;
    case DateRange.LAST_YEAR:
      minusDays = 365
      break;
    case DateRange.LAST_2_YEARS:
      minusDays = 2 * 365
      break;
    case DateRange.LAST_5_YEARS:
      minusDays = 5 * 365
      break;
    case DateRange.LAST_10_YEARS:
      minusDays = 10 * 365
      break;
  }

  if (!minusDays) {
    return null
  }

  const date = new Date(today);
  date.setDate(today.getDate() - minusDays!!);
  return date
}

export const calculateMonthlyChangeDataPoints = (
  updateDataPoints: UpdateDataPoint[]
) => {
  const firstAndLastUpdatesByYearMonth = new Map<
    string,
    [UpdateDataPoint, UpdateDataPoint]
  >();

  let currentYearMonth: string | null = null;
  let firstUpdateOfYearMonth: UpdateDataPoint | null = null;

  for (const updateDataPoint of updateDataPoints) {
    const yearMonth = updateDataPoint.date.substr(0, 7);
    if (yearMonth !== currentYearMonth) {
      currentYearMonth = yearMonth;
      firstUpdateOfYearMonth = updateDataPoint;

      firstAndLastUpdatesByYearMonth.set(yearMonth, [
        firstUpdateOfYearMonth!!,
        firstUpdateOfYearMonth!!,
      ]);
    } else {
      firstAndLastUpdatesByYearMonth.set(yearMonth, [
        firstUpdateOfYearMonth!!,
        updateDataPoint,
      ]);
    }
  }

  const dataPoints: MonthlyChangeDataPoint[] = [];
  const firstAndLastUpdatesByYearMonthEntries = Array.from(
    firstAndLastUpdatesByYearMonth.entries()
  );

  for (let i = 1; i < firstAndLastUpdatesByYearMonthEntries.length; i++) {
    const previousYearMonth = firstAndLastUpdatesByYearMonthEntries[i - 1];
    const currentYearMonth = firstAndLastUpdatesByYearMonthEntries[i];

    if (i == 1) {
      // add first year
      dataPoints.push({
        yearMonth: previousYearMonth[0],
        value: previousYearMonth[1][1].value - previousYearMonth[1][0].value,
        cost: previousYearMonth[1][1].cost - previousYearMonth[1][0].cost,
        return: previousYearMonth[1][1].return - previousYearMonth[1][0].return,
      });
    }

    dataPoints.push({
      yearMonth: currentYearMonth[0],
      value: currentYearMonth[1][1].value - previousYearMonth[1][1].value,
      cost: currentYearMonth[1][1].cost - previousYearMonth[1][1].cost,
      return: currentYearMonth[1][1].return - previousYearMonth[1][1].return,
    });
  }

  return dataPoints;
}; 

export const getAmountTextColor = (amount: number) => {
  if (amount > 0) {
    return "text-green-500"
  }
  if (amount < 0) {
    return "text-red-500"
  }
  return ""
}

const getLaterDate = (date1: string, date2: string): string => {
  return new Date(date1) > new Date(date2) ? date1 : date2;
};

export const getLastUpdateDate = (investmentRows: InvestmentRow[])=> investmentRows.reduce<string | null>(
  (result, investmentRow) => {
    if (result === null) {
      return investmentRow.lastUpdateDate ?? null;
    }
    if (investmentRow.lastUpdateDate === undefined) {
      return result;
    }
    return getLaterDate(result, investmentRow.lastUpdateDate);
  },
  null
);