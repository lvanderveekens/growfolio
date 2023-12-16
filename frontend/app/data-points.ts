import { UpdateDataPoint } from "./portfolio-page";

export interface MonthlyDataPoint {
  yearMonth: string;
  startingValue: number;
  endingValue: number;
  netDeposits: number;
}

export function calculateMonthlyDataPoints(updateDataPoints: UpdateDataPoint[]): MonthlyDataPoint[] {
  console.log("@>calculateMonthlyDataPoints");

  const firstAndLastUpdatesByYearMonth = new Map<string, [UpdateDataPoint, UpdateDataPoint]>();

  let currentYearMonth: string | null = null;
  let firstUpdateOfYearMonth: UpdateDataPoint | null = null;

  for (const updateDataPoint of updateDataPoints) {
    const yearMonth = updateDataPoint.date.substr(0, 7);
    if (yearMonth !== currentYearMonth) {
      currentYearMonth = yearMonth;
      firstUpdateOfYearMonth = updateDataPoint;

      firstAndLastUpdatesByYearMonth.set(yearMonth, [firstUpdateOfYearMonth!!, firstUpdateOfYearMonth!!]);
    } else {
      firstAndLastUpdatesByYearMonth.set(yearMonth, [firstUpdateOfYearMonth!!, updateDataPoint]);
    }
  }

  const monthlyDataPoints: MonthlyDataPoint[] = [];
  const firstAndLastUpdatesByYearMonthEntries = Array.from(firstAndLastUpdatesByYearMonth.entries());

  if (firstAndLastUpdatesByYearMonthEntries.length > 0) {
    // add first month
    const firstMonth = firstAndLastUpdatesByYearMonthEntries[0]
    monthlyDataPoints.push({
      yearMonth: firstMonth[0],
      startingValue: firstMonth[1][0].value,
      endingValue: firstMonth[1][1].value,
      netDeposits: firstMonth[1][1].cost - firstMonth[1][0].cost,
    });
  }

  for (let i = 1; i < firstAndLastUpdatesByYearMonthEntries.length; i++) {
    const previousYearMonth = firstAndLastUpdatesByYearMonthEntries[i - 1];
    const currentYearMonth = firstAndLastUpdatesByYearMonthEntries[i];

    monthlyDataPoints.push({
      yearMonth: currentYearMonth[0],
      startingValue: previousYearMonth[1][1].value,
      endingValue: currentYearMonth[1][1].value,
      netDeposits: currentYearMonth[1][1].cost - previousYearMonth[1][1].cost,
    });
  }

  console.log(monthlyDataPoints)
  console.log("@<calculateMonthlyDataPoints");
  return monthlyDataPoints;
}


export function calculateMonthlyROI(monthlyDataPoint: MonthlyDataPoint): number {
  return (monthlyDataPoint.endingValue - monthlyDataPoint.netDeposits) / monthlyDataPoint.startingValue - 1;
}

// Terminology is a bit mixed up, because here 'Return' means ROI.
export function calculateTimeWeightedReturn(monthlyDataPoints: MonthlyDataPoint[]): number {
  return monthlyDataPoints.reduce((accumulator, current) => {
    return accumulator * (1 + calculateMonthlyROI(current));
  }, 1) - 1;
}