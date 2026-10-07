// The period the figures at the top of "Heute" are measured over, chosen with ?z=7|30|90 in the address.
export const PERIODS = [7, 30, 90] as const;
export type Period = (typeof PERIODS)[number];
export const DEFAULT_PERIOD: Period = 7;

export function parsePeriod(raw: string | undefined): Period {
  const n = Number(raw);
  return (PERIODS as readonly number[]).includes(n) ? (n as Period) : DEFAULT_PERIOD;
}

// The words next to a change: "+4 diese Woche", "zur Woche davor" and, for a count that stands at some level rather than
// flowing in ("Anfragen ohne Interesse"), "seit einer Woche".
export function periodWords(period: Period) {
  return {
    short: period === 7 ? "7 Tage" : `${period} Tage`,
    within: period === 7 ? "diese Woche" : `in ${period} Tagen`,
    before: period === 7 ? "zur Woche davor" : `zu den ${period} Tagen davor`,
    previousIs: period === 7 ? "Woche davor" : `${period} Tage davor`,
    since: period === 7 ? "seit einer Woche" : `seit ${period} Tagen`,
  };
}

// How many days a line under a figure covers: at least a month, so a week still shows a shape.
export const lineDays = (period: Period) => Math.max(30, period);
