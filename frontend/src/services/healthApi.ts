interface AuthResponse {
  token: string;
  refresh: string;
  expiry: string;
}

interface HealthDataPoint {
  _id: string;
  app: string;
  data: any;
  start: string;
  end?: string;
  id: string;
}

class HealthApiService {
  private baseUrl = '/api/v2'; // Using Vite proxy
  private token: string | null = null;
  private refreshToken: string | null = null;
  private expiry: Date | null = null;

  constructor() {
    // Load stored tokens
    this.token = localStorage.getItem('health_token');
    this.refreshToken = localStorage.getItem('health_refresh_token');
    const storedExpiry = localStorage.getItem('health_token_expiry');
    if (storedExpiry) {
      this.expiry = new Date(storedExpiry);
    }
  }

  private saveTokens(authData: AuthResponse) {
    this.token = authData.token;
    this.refreshToken = authData.refresh;
    this.expiry = new Date(authData.expiry);
    
    localStorage.setItem('health_token', this.token);
    localStorage.setItem('health_refresh_token', this.refreshToken);
    localStorage.setItem('health_token_expiry', authData.expiry);
  }

  private clearTokens() {
    this.token = null;
    this.refreshToken = null;
    this.expiry = null;
    
    localStorage.removeItem('health_token');
    localStorage.removeItem('health_refresh_token');
    localStorage.removeItem('health_token_expiry');
  }

  // Normalize different payload shapes into what processors expect
  private normalize(dataType: string, docs: HealthDataPoint[]): HealthDataPoint[] {
    return docs.map((d) => {
      const clone: HealthDataPoint = { ...d, data: { ...(d as any).data } } as any;
      const data: any = clone.data || {};

      // Heart rate normalization
      if (dataType === 'heartRate') {
        if (data.beatsPerMinute == null) {
          if (typeof data.value === 'number') data.beatsPerMinute = data.value;
          else if (typeof data.bpm === 'number') data.beatsPerMinute = data.bpm;
        }
      }

      // Steps normalization
      if (dataType === 'steps' || dataType === 'stepCount') {
        if (data.count == null) {
          if (typeof data.steps === 'number') data.count = data.steps;
          else if (typeof data.value === 'number') data.count = data.value;
        }
      }

      // Calories normalization (kcal)
      if (
        dataType === 'activeCaloriesBurned' ||
        dataType === 'totalCaloriesBurned' ||
        dataType === 'calories'
      ) {
        const kcal =
          (data.energy?.inKilocalories as number | undefined) ??
          (typeof data.kilocalories === 'number' ? data.kilocalories : undefined) ??
          (typeof data.calories === 'number' ? data.calories : undefined) ??
          (typeof data.value === 'number' ? data.value : undefined);
        if (kcal != null) {
          data.energy = { inKilocalories: kcal };
        }
      }

      // Distance normalization (km)
      if (
        dataType === 'distance' ||
        dataType === 'walkingDistance' ||
        dataType === 'runningDistance'
      ) {
        let km: number | undefined = data.length?.inKilometers;
        if (typeof km !== 'number') {
          if (typeof data.kilometers === 'number') km = data.kilometers;
          else if (typeof data.km === 'number') km = data.km;
          else if (typeof data.meters === 'number') km = data.meters / 1000;
          else if (typeof data.value === 'number') km = data.value; // assume already km
        }
        if (km != null) {
          data.length = { inKilometers: km };
        }
      }

      return clone;
    });
  }

  // Try multiple backend collection names until one returns data
  private async fetchFirstAvailable(
    candidates: string[],
    queries: any = {}
  ): Promise<HealthDataPoint[]> {
    for (const name of candidates) {
      try {
        const docs = await this.fetchHealthData(name, queries, /*skipAuth*/ false);
        if (Array.isArray(docs) && docs.length > 0) {
          return this.normalize(name, docs);
        }
        // if empty, keep trying next candidate
      } catch (_e) {
        // ignore and try next candidate
      }
    }
    // last attempt: still normalize last candidate's empty result to keep shape predictable
    return [];
  }

  private async refreshTokenIfNeeded(): Promise<boolean> {
    if (!this.expiry || !this.refreshToken) return false;
    
    // Check if token expires in the next 5 minutes
    const fiveMinutesFromNow = new Date(Date.now() + 5 * 60 * 1000);
    if (this.expiry > fiveMinutesFromNow) return true;
    
    try {
      const response = await fetch(`${this.baseUrl}/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refresh: this.refreshToken }),
      });
      
      if (response.ok) {
        const authData: AuthResponse = await response.json();
        this.saveTokens(authData);
        return true;
      } else {
        this.clearTokens();
        return false;
      }
    } catch (error) {
      console.error('Error refreshing token:', error);
      this.clearTokens();
      return false;
    }
  }

  async authenticate(): Promise<boolean> {
    try {
      // Try to refresh existing token first
      if (await this.refreshTokenIfNeeded()) {
        return true;
      }

      // If no valid token, login with default credentials
      const response = await fetch(`${this.baseUrl}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: 'iotopia',
          password: 'iotopia'
        }),
      });

      if (response.ok) {
        const authData: AuthResponse = await response.json();
        this.saveTokens(authData);
        return true;
      } else {
        const error = await response.json();
        console.error('Authentication failed:', error);
        return false;
      }
    } catch (error) {
      console.error('Authentication error:', error);
      return false;
    }
  }

  async fetchHealthData(
    dataType: string,
    queries: any = {},
    skipAuth = false
  ): Promise<HealthDataPoint[]> {
    if (!skipAuth) {
      await this.authenticate();
    }
    
    if (!this.token) {
      throw new Error('No authentication token available');
    }

    try {
      const response = await fetch(`${this.baseUrl}/fetch/${dataType}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.token}`,
        },
        body: JSON.stringify({ queries }),
      });

      if (response.ok) {
        const payload: HealthDataPoint[] = await response.json();
        return this.normalize(dataType, payload);
      } else if (response.status === 403) {
        // Token expired, try to authenticate again
        this.clearTokens();
        if (await this.authenticate()) {
          return this.fetchHealthData(dataType, queries, true);
        }
        throw new Error('Authentication failed');
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch data');
      }
    } catch (error) {
      console.error(`Error fetching ${dataType}:`, error);
      throw error;
    }
  }

  // Convenience methods for specific data types
  async getStepsData(startDate?: string, endDate?: string): Promise<HealthDataPoint[]> {
    const queries: any = {};
    if (startDate) queries.start = { $gte: startDate };
    if (endDate) queries.end = { $lte: endDate };
    // Try both common collection names
    return this.fetchFirstAvailable(['steps', 'stepCount'], queries);
  }

  async getHeartRateData(startDate?: string, endDate?: string): Promise<HealthDataPoint[]> {
    const queries: any = {};
    if (startDate) queries.start = { $gte: startDate };
    if (endDate) queries.end = { $lte: endDate };
    return this.fetchHealthData('heartRate', queries);
  }

  async getCaloriesData(startDate?: string, endDate?: string): Promise<HealthDataPoint[]> {
    const queries: any = {};
    if (startDate) queries.start = { $gte: startDate };
    if (endDate) queries.end = { $lte: endDate };
    return this.fetchFirstAvailable(['activeCaloriesBurned', 'totalCaloriesBurned', 'calories'], queries);
  }

  async getSleepData(startDate?: string, endDate?: string): Promise<HealthDataPoint[]> {
    const queries: any = {};
    if (startDate) queries.start = { $gte: startDate };
    if (endDate) queries.end = { $lte: endDate };
    return this.fetchFirstAvailable(['sleepSession', 'sleep'], queries);
  }

  async getDistanceData(startDate?: string, endDate?: string): Promise<HealthDataPoint[]> {
    const queries: any = {};
    if (startDate) queries.start = { $gte: startDate };
    if (endDate) queries.end = { $lte: endDate };
    return this.fetchFirstAvailable(['distance', 'walkingDistance', 'runningDistance'], queries);
  }

  // Get all available data types for exploration
  async getAllAvailableData(): Promise<{ [key: string]: number }> {
    // Map primary type -> fallback names
    const typeMap: Record<string, string[]> = {
      steps: ['steps', 'stepCount'],
      heartRate: ['heartRate'],
      activeCaloriesBurned: ['activeCaloriesBurned', 'totalCaloriesBurned', 'calories'],
      sleepSession: ['sleepSession', 'sleep'],
      distance: ['distance', 'walkingDistance', 'runningDistance'],
      speed: ['speed'],
      bloodPressure: ['bloodPressure'],
      oxygenSaturation: ['oxygenSaturation'],
      weight: ['weight'],
      height: ['height'],
      bodyFat: ['bodyFat'],
      hydration: ['hydration'],
      exerciseSession: ['exerciseSession']
    };

    const results: { [key: string]: number } = {};
    for (const [primary, candidates] of Object.entries(typeMap)) {
      try {
        const data = await this.fetchFirstAvailable(candidates);
        results[primary] = data.length;
      } catch {
        results[primary] = 0;
      }
    }
    return results;
  }
}

export const healthApi = new HealthApiService();
export type { HealthDataPoint };
