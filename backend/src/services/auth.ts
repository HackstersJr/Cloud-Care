import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../config/environment';
import { database } from './database';
import { loggers } from '../utils/logger';

export interface User {
  id: string;
  email: string;
  password_hash: string;
  role: 'patient' | 'doctor' | 'nurse' | 'admin';
  first_name: string;
  last_name: string;
  phone?: string;
  is_active: boolean;
  is_email_verified: boolean;
  last_login_at?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: 'patient' | 'doctor' | 'nurse';
}

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
  sessionId: string;
  isVerified: boolean;
}

export interface RefreshTokenData {
  id: string;
  user_id: string;
  token_hash: string;
  expires_at: Date;
  created_at: Date;
  is_revoked: boolean;
}

export class AuthService {
  private readonly saltRounds: number;
  private readonly jwtSecret: string;
  private readonly jwtExpiresIn: string;
  private readonly refreshTokenSecret: string;
  private readonly refreshTokenExpiresIn: string;

  constructor() {
    this.saltRounds = config.security.bcryptSaltRounds;
    this.jwtSecret = config.jwt.secret;
    this.jwtExpiresIn = config.jwt.expiresIn;
    this.refreshTokenSecret = config.jwt.refreshSecret;
    this.refreshTokenExpiresIn = config.jwt.refreshExpiresIn;
  }

  /**
   * Register a new user
   */
  async register(userData: RegisterData, ipAddress: string): Promise<{ user: Omit<User, 'password_hash'>, tokens: AuthTokens }> {
    try {
      // Check if user already exists
      const existingUser = await this.findUserByEmail(userData.email);
      if (existingUser) {
        throw new Error('User with this email already exists');
      }

      // Hash password
      const passwordHash = await this.hashPassword(userData.password);

      // Create user in database
      const userId = uuidv4();
      const query = `
        INSERT INTO users (id, email, password_hash, role, is_active, is_email_verified)
        VALUES ($1, $2, $3, $4, true, false)
        RETURNING id, email, role, is_active, is_email_verified, created_at, updated_at
      `;

      const result = await database.query<Omit<User, 'password_hash'>>(query, [
        userId,
        userData.email.toLowerCase(),
        passwordHash,
        userData.role
      ]);

      const user = result.rows[0];
      if (!user) {
        throw new Error('Failed to create user');
      }

      // Create role-specific profile
      let userWithProfile = { ...user, first_name: '', last_name: '', phone_number: '' };
      
      if (userData.role === 'patient') {
        const patientQuery = `
          INSERT INTO patients (id, user_id, first_name, last_name, phone_number, date_of_birth, address)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          RETURNING first_name, last_name, phone_number
        `;
        
        const patientResult = await database.query(patientQuery, [
          uuidv4(),
          userId,
          userData.firstName,
          userData.lastName,
          userData.phone || '',
          '1990-01-01', // Default date, should be provided in real registration
          JSON.stringify({ street: '', city: '', state: '', zipCode: '', country: '' })
        ]);

        const profile = patientResult.rows[0];
        userWithProfile = { ...user, ...profile };

      } else if (userData.role === 'doctor') {
        const doctorQuery = `
          INSERT INTO doctors (id, user_id, first_name, last_name, phone_number, specialization, license_number, qualification)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          RETURNING first_name, last_name, phone_number, specialization
        `;
        
        const doctorResult = await database.query(doctorQuery, [
          uuidv4(),
          userId,
          userData.firstName,
          userData.lastName,
          userData.phone || '',
          ['General Practice'], // Array of specializations
          'LIC-' + Date.now(), // Generate temporary license number
          ['MBBS'] // Default qualification array
        ]);

        const profile = doctorResult.rows[0];
        userWithProfile = { ...user, ...profile, specialization: Array.isArray(profile.specialization) ? profile.specialization.join(', ') : profile.specialization };

      } else if (userData.role === 'nurse') {
        const nurseQuery = `
          INSERT INTO nurses (id, user_id, first_name, last_name, phone_number, license_number, department)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          RETURNING first_name, last_name, phone_number
        `;
        
        const nurseResult = await database.query(nurseQuery, [
          uuidv4(),
          userId,
          userData.firstName,
          userData.lastName,
          userData.phone || '',
          'NUR-' + Date.now(), // Generate temporary license number
          'General Nursing'
        ]);

        const profile = nurseResult.rows[0];
        userWithProfile = { ...user, ...profile };
      }

      // Generate tokens
      const tokens = await this.generateTokens(user.id, user.email, user.role, user.is_email_verified || false, ipAddress);

      // Log registration
      loggers.auth.login(user.id, ipAddress, true);

      return { user: userWithProfile, tokens };

    } catch (error: any) {
      loggers.auth.login('unknown', ipAddress, false);
      throw error;
    }
  }

  /**
   * Login user
   */
  async login(credentials: LoginCredentials, ipAddress: string): Promise<{ user: Omit<User, 'password_hash'>, tokens: AuthTokens }> {
    try {
      // Find user by email with role-specific profile data
      const userQuery = `
        SELECT 
          u.id, u.email, u.password_hash, u.role, u.is_email_verified, u.is_active,
          u.created_at, u.updated_at, u.last_login_at,
          CASE 
            WHEN u.role = 'patient' THEN p.first_name
            WHEN u.role = 'doctor' THEN d.first_name
            WHEN u.role = 'nurse' THEN n.first_name
          END as first_name,
          CASE 
            WHEN u.role = 'patient' THEN p.last_name
            WHEN u.role = 'doctor' THEN d.last_name
            WHEN u.role = 'nurse' THEN n.last_name
          END as last_name,
          CASE 
            WHEN u.role = 'patient' THEN p.phone_number
            WHEN u.role = 'doctor' THEN d.phone_number
            WHEN u.role = 'nurse' THEN n.phone_number
          END as phone_number,
          CASE 
            WHEN u.role = 'doctor' THEN ARRAY_TO_STRING(d.specialization, ', ')
            ELSE NULL
          END as specialization
        FROM users u
        LEFT JOIN patients p ON u.id = p.user_id AND u.role = 'patient'
        LEFT JOIN doctors d ON u.id = d.user_id AND u.role = 'doctor'
        LEFT JOIN nurses n ON u.id = n.user_id AND u.role = 'nurse'
        WHERE u.email = $1 AND u.is_active = true
      `;
      
      const result = await database.query(userQuery, [credentials.email.toLowerCase()]);
      const user = result.rows[0];

      if (!user) {
        throw new Error('Invalid email or password');
      }

      // Check if account is active
      if (!user.is_active) {
        throw new Error('Account is deactivated');
      }

      // Verify password
      const isPasswordValid = await this.verifyPassword(credentials.password, user.password_hash);
      if (!isPasswordValid) {
        throw new Error('Invalid email or password');
      }

      // Update last login
      await database.query(
        'UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = $1',
        [user.id]
      );

      // Generate tokens
      const tokens = await this.generateTokens(user.id, user.email, user.role, user.is_email_verified || false, ipAddress);

      // Remove password hash from response
      const { password_hash, ...userWithoutPassword } = user;

      // Log successful login
      loggers.auth.login(user.id, ipAddress, true);

      return { user: userWithoutPassword, tokens };

    } catch (error: any) {
      loggers.auth.login('unknown', ipAddress, false);
      throw error;
    }
  }

  /**
   * Logout user (revoke refresh token)
   */
  async logout(refreshToken: string, ipAddress: string): Promise<void> {
    try {
      // Verify refresh token
      const decoded = jwt.verify(refreshToken, this.refreshTokenSecret) as TokenPayload;

      // Revoke refresh token in database
      await database.query(
        'UPDATE refresh_tokens SET is_revoked = true WHERE user_id = $1 AND is_revoked = false',
        [decoded.userId]
      );

      // Log logout
      loggers.auth.logout(decoded.userId, ipAddress);

    } catch (error: any) {
      // Log failed logout attempt
      loggers.auth.logout('unknown', ipAddress);
      throw new Error('Invalid refresh token');
    }
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken: string, ipAddress: string): Promise<AuthTokens> {
    try {
      // Verify refresh token
      const decoded = jwt.verify(refreshToken, this.refreshTokenSecret) as TokenPayload;

      // Check if refresh token exists and is not revoked
      const tokenQuery = `
        SELECT rt.*, u.email, u.role, u.is_email_verified 
        FROM refresh_tokens rt 
        JOIN users u ON rt.user_id = u.id 
        WHERE rt.user_id = $1 AND rt.is_revoked = false AND rt.expires_at > CURRENT_TIMESTAMP
      `;

      const result = await database.query(tokenQuery, [decoded.userId]);
      if (result.rows.length === 0) {
        throw new Error('Invalid or expired refresh token');
      }

      const tokenData = result.rows[0];

      // Generate new tokens
      const tokens = await this.generateTokens(decoded.userId, tokenData.email, tokenData.role, tokenData.is_email_verified || false, ipAddress);

      // Log token refresh
      loggers.auth.tokenRefresh(decoded.userId, ipAddress);

      return tokens;

    } catch (error: any) {
      throw new Error('Invalid refresh token');
    }
  }

  /**
   * Verify JWT token
   */
  async verifyToken(token: string): Promise<TokenPayload> {
    try {
      const decoded = jwt.verify(token, this.jwtSecret) as TokenPayload;
      
      // Check if user still exists and is active
      const user = await this.findUserById(decoded.userId);
      if (!user || !user.is_active) {
        throw new Error('User not found or inactive');
      }

      return decoded;

    } catch (error: any) {
      throw new Error('Invalid token');
    }
  }

  /**
   * Change user password
   */
  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    try {
      // Get user's current password hash
      const user = await this.findUserById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Verify current password
      const isCurrentPasswordValid = await this.verifyPassword(currentPassword, user.password_hash);
      if (!isCurrentPasswordValid) {
        throw new Error('Current password is incorrect');
      }

      // Hash new password
      const newPasswordHash = await this.hashPassword(newPassword);

      // Update password in database
      await database.query(
        'UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        [newPasswordHash, userId]
      );

      // Revoke all refresh tokens for this user (force re-login)
      await database.query(
        'UPDATE refresh_tokens SET is_revoked = true WHERE user_id = $1',
        [userId]
      );

    } catch (error: any) {
      throw error;
    }
  }

  /**
   * Reset password (for forgot password flow)
   */
  async resetPassword(email: string): Promise<string> {
    try {
      const user = await this.findUserByEmail(email);
      if (!user) {
        // Don't reveal if email exists or not
        return 'If the email exists, a reset link has been sent';
      }

      // Generate reset token (in real app, this would be sent via email)
      const resetToken = uuidv4();
      const expiresAt = new Date(Date.now() + 3600000); // 1 hour

      // Store reset token in database
      await database.query(
        `INSERT INTO password_reset_tokens (id, user_id, token_hash, expires_at) 
         VALUES ($1, $2, $3, $4)`,
        [uuidv4(), user.id, await bcrypt.hash(resetToken, this.saltRounds), expiresAt]
      );

      return resetToken; // In real app, send this via email

    } catch (error: any) {
      throw error;
    }
  }

  /**
   * Find user by email
   */
  private async findUserByEmail(email: string): Promise<User | null> {
    const query = 'SELECT * FROM users WHERE email = $1 AND is_active = true';
    const result = await database.query<User>(query, [email.toLowerCase()]);
    return result.rows[0] || null;
  }

  /**
   * Find user by ID
   */
  private async findUserById(id: string): Promise<User | null> {
    const query = 'SELECT * FROM users WHERE id = $1';
    const result = await database.query<User>(query, [id]);
    return result.rows[0] || null;
  }

  /**
   * Hash password
   */
  private async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, this.saltRounds);
  }

  /**
   * Verify password
   */
  private async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  /**
   * Generate JWT and refresh tokens
   */
  private async generateTokens(userId: string, email: string, role: string, isEmailVerified: boolean, ipAddress: string): Promise<AuthTokens> {
    const sessionId = uuidv4();

    // Create JWT payload
    const payload: TokenPayload = {
      userId,
      email,
      role,
      sessionId,
      isVerified: isEmailVerified
    };

    // Generate access token
    const accessToken = jwt.sign(payload, this.jwtSecret, {
      expiresIn: this.jwtExpiresIn,
      issuer: 'cloudcare-backend',
      audience: 'cloudcare-client'
    } as jwt.SignOptions);

    // Generate refresh token
    const refreshToken = jwt.sign(payload, this.refreshTokenSecret, {
      expiresIn: this.refreshTokenExpiresIn,
      issuer: 'cloudcare-backend',
      audience: 'cloudcare-client'
    } as jwt.SignOptions);

    // Store refresh token in database
    const refreshTokenId = uuidv4();
    const refreshTokenHash = await bcrypt.hash(refreshToken, this.saltRounds);
    const expiresAt = new Date(Date.now() + this.parseTimeToMs(this.refreshTokenExpiresIn));

    await database.query(
      `INSERT INTO refresh_tokens (id, user_id, token_hash, expires_at, created_ip) 
       VALUES ($1, $2, $3, $4, $5)`,
      [refreshTokenId, userId, refreshTokenHash, expiresAt, ipAddress]
    );

    return {
      accessToken,
      refreshToken,
      expiresIn: this.parseTimeToMs(this.jwtExpiresIn)
    };
  }

  /**
   * Parse time string to milliseconds
   */
  private parseTimeToMs(timeStr: string): number {
    const match = timeStr.match(/^(\d+)([smhd])$/);
    if (!match || !match[1]) return 3600000; // Default 1 hour

    const value = parseInt(match[1]);
    const unit = match[2];

    switch (unit) {
      case 's': return value * 1000;
      case 'm': return value * 60 * 1000;
      case 'h': return value * 60 * 60 * 1000;
      case 'd': return value * 24 * 60 * 60 * 1000;
      default: return 3600000;
    }
  }
}

// Create singleton instance
export const authService = new AuthService();
