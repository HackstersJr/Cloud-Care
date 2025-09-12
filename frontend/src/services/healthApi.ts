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

  async fetchHealthData(dataType: string, queries: any = {}): Promise<HealthDataPoint[]> {
    await this.authenticate();
    
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
        return await response.json();
      } else if (response.status === 403) {
        // Token expired, try to authenticate again
        this.clearTokens();
        if (await this.authenticate()) {
          return this.fetchHealthData(dataType, queries);
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
    return this.fetchHealthData('steps', queries);
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
    return this.fetchHealthData('activeCaloriesBurned', queries);
  }

  async getSleepData(startDate?: string, endDate?: string): Promise<HealthDataPoint[]> {
    const queries: any = {};
    if (startDate) queries.start = { $gte: startDate };
    if (endDate) queries.end = { $lte: endDate };
    return this.fetchHealthData('sleepSession', queries);
  }

  async getDistanceData(startDate?: string, endDate?: string): Promise<HealthDataPoint[]> {
    const queries: any = {};
    if (startDate) queries.start = { $gte: startDate };
    if (endDate) queries.end = { $lte: endDate };
    return this.fetchHealthData('distance', queries);
  }

  // Get all available data types for exploration
  async getAllAvailableData(): Promise<{[key: string]: number}> {
    const dataTypes = [
      'steps', 'heartRate', 'activeCaloriesBurned', 'totalCaloriesBurned',
      'sleepSession', 'distance', 'speed', 'bloodPressure', 'oxygenSaturation',
      'weight', 'height', 'bodyFat', 'hydration', 'exerciseSession'
    ];

    const results: {[key: string]: number} = {};
    
    for (const dataType of dataTypes) {
      try {
        const data = await this.fetchHealthData(dataType);
        results[dataType] = data.length;
      } catch (error) {
        results[dataType] = 0;
      }
    }
    
    return results;
  }
}

export const healthApi = new HealthApiService();
export type { HealthDataPoint };
