import { Request, Response, NextFunction } from 'express';
import { validateJWT } from './auth';
import { database } from '../services/database';
import { logger } from '../utils/logger';

/**
 * Middleware that allows either JWT authentication OR valid QR token authentication
 * This is used for AI endpoints that can be accessed via QR sharing or regular login
 */
export const validateJWTOrQRToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // First try JWT authentication
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      // Try JWT auth first
      try {
        validateJWT(req, res, (err) => {
          if (!err) {
            // JWT auth successful
            logger.info('AI request authenticated via JWT', { 
              userId: (req as any).user?.id,
              url: req.url 
            });
            return next();
          } else {
            // JWT failed, try QR token
            validateQRToken();
          }
        });
        return;
      } catch (jwtError) {
        // JWT failed, try QR token
        validateQRToken();
        return;
      }
    } else {
      // No JWT header, try QR token
      validateQRToken();
      return;
    }

    async function validateQRToken(): Promise<void> {
      try {
        const { qrToken } = req.body;
        
        if (!qrToken) {
          res.status(401).json({
            success: false,
            message: 'Authentication required: Provide either valid JWT token or QR token'
          });
          return;
        }

        // Validate QR token using raw SQL
        const tokenQuery = `
          SELECT qst.*, u.id as user_id, u.email, u.role 
          FROM qr_share_tokens qst
          JOIN users u ON qst.user_id = u.id
          WHERE qst.token = $1 
            AND qst.expires_at > NOW() 
            AND qst.revoked = false
        `;
        
        const tokenResult = await database.query(tokenQuery, [qrToken]);

        if (tokenResult.rows.length === 0) {
          res.status(401).json({
            success: false,
            message: 'Invalid or expired QR token'
          });
          return;
        }

        const tokenData = tokenResult.rows[0];

        // Update access count
        const updateQuery = `
          UPDATE qr_share_tokens 
          SET access_count = access_count + 1, 
              last_accessed = NOW(),
              updated_at = NOW()
          WHERE token = $1
        `;
        await database.query(updateQuery, [qrToken]);

        // Set user context for QR token access
        (req as any).user = {
          id: tokenData.user_id,
          email: tokenData.email,
          role: tokenData.role
        };
        
        (req as any).qrTokenData = tokenData;
        
        logger.info('AI request authenticated via QR token', { 
          qrToken: qrToken.substring(0, 8) + '...',
          userId: tokenData.user_id,
          url: req.url 
        });

        next();
        return;
      } catch (qrError) {
        logger.error('QR token validation error:', qrError);
        res.status(401).json({
          success: false,
          message: 'Invalid QR token authentication'
        });
        return;
      }
    }

  } catch (error) {
    logger.error('Authentication middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Authentication error'
    });
    return;
  }
};
