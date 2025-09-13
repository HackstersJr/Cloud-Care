import { format, subDays, parseISO, isSameDay } from 'date-fns';
import { HealthDataPoint } from '../services/healthApi';

export interface ProcessedHealthData {
  steps: {
    today: number;
    weekly: { date: string; value: number }[];
    total: number;
  };
  heartRate: {
    current: number;
    average: number;
    trend: { time: string; value: number }[];
  };
  calories: {
    today: number;
    weekly: { date: string; value: number }[];
    target: number;
  };
  sleep: {
    lastNight: number; // in hours
    weekly: { date: string; value: number }[];
    average: number;
  };
  distance: {
    today: number;
    weekly: { date: string; value: number }[];
    unit: string;
  };
}

export const processHealthData = (rawData: {
  steps: HealthDataPoint[];
  heartRate: HealthDataPoint[];
  calories: HealthDataPoint[];
  sleep: HealthDataPoint[];
  distance: HealthDataPoint[];
}, referenceEndDate?: Date): ProcessedHealthData => {
  const endDay = referenceEndDate ?? new Date();
  // inclusive range: last 7 days ending at endDay
  const last7Days = Array.from({ length: 7 }, (_, i) => subDays(endDay, 6 - i));

  // Process Steps Data
  const processSteps = () => {
    const todaySteps = rawData.steps
      .filter(item => isSameDay(parseISO(item.start), endDay))
      .reduce((sum, item) => sum + (item.data.count || 0), 0);

    const weeklySteps = last7Days.map(date => {
      const daySteps = rawData.steps
        .filter(item => {
          const itemDate = parseISO(item.start);
          return format(itemDate, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd');
        })
        .reduce((sum, item) => sum + (item.data.count || 0), 0);

      return {
        date: format(date, 'MMM dd'),
        value: daySteps
      };
    });

    return {
      today: todaySteps,
      weekly: weeklySteps,
      total: rawData.steps.reduce((sum, item) => sum + (item.data.count || 0), 0)
    };
  };

  // Process Heart Rate Data
  const processHeartRate = () => {
  const todayHR = rawData.heartRate.filter(item => isSameDay(parseISO(item.start), endDay));
    const current = todayHR.length > 0 ? todayHR[todayHR.length - 1].data.beatsPerMinute || 0 : 0;
    
    const allHR = rawData.heartRate.map(item => item.data.beatsPerMinute || 0);
    const average = allHR.length > 0 ? Math.round(allHR.reduce((sum, hr) => sum + hr, 0) / allHR.length) : 0;

    const trend = rawData.heartRate
      .filter(item => isSameDay(parseISO(item.start), endDay))
      .slice(-24) // Last 24 readings
      .map(item => ({
        time: format(parseISO(item.start), 'HH:mm'),
        value: item.data.beatsPerMinute || 0
      }));

    return { current, average, trend };
  };

  // Process Calories Data
  const processCalories = () => {
    const todayCalories = rawData.calories
      .filter(item => isSameDay(parseISO(item.start), endDay))
      .reduce((sum, item) => sum + (item.data.energy?.inKilocalories || 0), 0);

    const weeklyCalories = last7Days.map(date => {
      const dayCalories = rawData.calories
        .filter(item => {
          const itemDate = parseISO(item.start);
          return format(itemDate, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd');
        })
        .reduce((sum, item) => sum + (item.data.energy?.inKilocalories || 0), 0);

      return {
        date: format(date, 'MMM dd'),
        value: Math.round(dayCalories)
      };
    });

    return {
      today: Math.round(todayCalories),
      weekly: weeklyCalories,
      target: 2000 // Default target
    };
  };

  // Process Sleep Data
  const processSleep = () => {
    const sleepSessions = rawData.sleep.map(item => {
      const start = parseISO(item.start);
      const end = item.end ? parseISO(item.end) : start;
      const duration = (end.getTime() - start.getTime()) / (1000 * 60 * 60); // hours
      return {
        date: format(start, 'yyyy-MM-dd'),
        duration: duration
      };
    });

    const lastNight = sleepSessions.length > 0 ? sleepSessions[sleepSessions.length - 1].duration : 0;

    const weeklySleep = last7Days.map(date => {
      const daySleep = sleepSessions.find(s => s.date === format(date, 'yyyy-MM-dd'));
      return {
        date: format(date, 'MMM dd'),
        value: daySleep ? Math.round(daySleep.duration * 10) / 10 : 0
      };
    });

    const average = sleepSessions.length > 0 
      ? sleepSessions.reduce((sum, s) => sum + s.duration, 0) / sleepSessions.length 
      : 0;

    return {
      lastNight: Math.round(lastNight * 10) / 10,
      weekly: weeklySleep,
      average: Math.round(average * 10) / 10
    };
  };

  // Process Distance Data
  const processDistance = () => {
    const todayDistance = rawData.distance
      .filter(item => isSameDay(parseISO(item.start), endDay))
      .reduce((sum, item) => sum + (item.data.length?.inKilometers || 0), 0);

    const weeklyDistance = last7Days.map(date => {
      const dayDistance = rawData.distance
        .filter(item => {
          const itemDate = parseISO(item.start);
          return format(itemDate, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd');
        })
        .reduce((sum, item) => sum + (item.data.length?.inKilometers || 0), 0);

      return {
        date: format(date, 'MMM dd'),
        value: Math.round(dayDistance * 100) / 100
      };
    });

    return {
      today: Math.round(todayDistance * 100) / 100,
      weekly: weeklyDistance,
      unit: 'km'
    };
  };

  return {
    steps: processSteps(),
    heartRate: processHeartRate(),
    calories: processCalories(),
    sleep: processSleep(),
    distance: processDistance()
  };
};

export const getTodayDateString = () => format(new Date(), 'yyyy-MM-dd');
export const getWeekAgoDateString = () => format(subDays(new Date(), 7), 'yyyy-MM-dd');

export const formatHealthValue = (value: number, type: string): string => {
  switch (type) {
    case 'steps':
      return value.toLocaleString();
    case 'heartRate':
      return `${value} bpm`;
    case 'calories':
      return `${value.toLocaleString()} cal`;
    case 'sleep':
      return `${value}h`;
    case 'distance':
      return `${value} km`;
    default:
      return value.toString();
  }
};
