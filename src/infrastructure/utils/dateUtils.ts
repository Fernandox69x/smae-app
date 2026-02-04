/**
 * Date Utility for handling Calendar Dates
 * avoids timezone issues by treating dates as strictly YYYY-MM-DD
 */

export const DateUtils = {
    /**
     * Returns today's date string in YYYY-MM-DD format using local time
     */
    getTodayString: (): string => {
        const d = new Date();
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    },

    /**
     * Parses a "YYYY-MM-DD" string into { year, month, day } integers
     * Note: month is 1-indexed (1=Jan, 12=Dec)
     */
    parseString: (dateStr: string) => {
        const [y, m, d] = dateStr.split('-').map(Number);
        return { year: y, month: m, day: d };
    },

    /**
     * Creates a Date object set to NOON (12:00:00) local time for the given YYYY-MM-DD.
     * Use this when you need a Date object for libraries but want to avoid "midnight roll-back" issues.
     */
    toNoonDate: (dateStr: string): Date => {
        const { year, month, day } = DateUtils.parseString(dateStr);
        return new Date(year, month - 1, day, 12, 0, 0);
    },

    /**
     * Returns true if dateStr1 (YYYY-MM-DD) is in the same month and year as dateStr2
     */
    isSameMonth: (dateStr1: string, dateStr2: string): boolean => {
        const d1 = DateUtils.parseString(dateStr1);
        const d2 = DateUtils.parseString(dateStr2);
        return d1.year === d2.year && d1.month === d2.month;
    },

    /**
     * Returns true if dateStr1 is chronologically BEFORE dateStr2
     */
    isBefore: (dateStr1: string, dateStr2: string): boolean => {
        return dateStr1 < dateStr2; // String comparison works for ISO format
    },

    /**
     * Returns true if dateStr1 is chronologically AFTER dateStr2
     */
    isAfter: (dateStr1: string, dateStr2: string): boolean => {
        return dateStr1 > dateStr2;
    }
};
