const { ConfidentialClientApplication } = require('@azure/msal-node');
const axios = require('axios');
const { logger } = require('../utils/logger');

class GraphEmailService {
  constructor() {
    // Check if Azure credentials are configured
    if (!process.env.AZURE_CLIENT_ID || !process.env.AZURE_CLIENT_SECRET || !process.env.AZURE_TENANT_ID) {
      logger.warn('Microsoft Graph credentials not configured. Email functionality will be disabled.');
      this.isConfigured = false;
      return;
    }

    this.clientConfig = {
      auth: {
        clientId: process.env.AZURE_CLIENT_ID,
        clientSecret: process.env.AZURE_CLIENT_SECRET,
        authority: `https://login.microsoftonline.com/${process.env.AZURE_TENANT_ID}`
      }
    };
    
    this.client = new ConfidentialClientApplication(this.clientConfig);
    this.graphEndpoint = process.env.AZURE_GRAPH_ENDPOINT || 'https://graph.microsoft.com';
    this.isConfigured = true;
  }

  async getAccessToken() {
    if (!this.isConfigured) {
      throw new Error('Microsoft Graph not configured');
    }

    try {
      const clientCredentialRequest = {
        scopes: [`${this.graphEndpoint}/.default`],
      };

      const response = await this.client.acquireTokenByClientCredential(clientCredentialRequest);
      return response.accessToken;
    } catch (error) {
      logger.error('Failed to acquire access token:', error);
      throw new Error('Failed to authenticate with Microsoft Graph');
    }
  }

  async sendEmail(to, subject, htmlContent, textContent = '') {
    if (!this.isConfigured) {
      logger.warn(`Email sending skipped (not configured): ${subject} to ${to}`);
      return true; // Return success to not break the flow
    }

    try {
      const accessToken = await this.getAccessToken();
      
      const emailMessage = {
        message: {
          subject: subject,
          body: {
            contentType: 'HTML',
            content: htmlContent
          },
          toRecipients: [
            {
              emailAddress: {
                address: to
              }
            }
          ]
        }
      };

      const response = await axios.post(
        `${this.graphEndpoint}/v1.0/me/sendMail`,
        emailMessage,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      logger.info(`Email sent successfully to ${to}`);
      return true;
    } catch (error) {
      logger.error('Failed to send email:', error.response?.data || error.message);
      throw new Error('Failed to send email via Microsoft Graph');
    }
  }

  async sendWelcomeEmail(user, verificationToken) {
    const verificationUrl = `${process.env.BASE_URL || 'http://localhost:3000'}/api/auth/verify-email?token=${verificationToken}`;
    
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Welcome to Network Identity Manager!</h2>
        <p>Hello ${user.firstName} ${user.lastName},</p>
        <p>Thank you for registering with Network Identity Manager. To complete your registration, please verify your email address by clicking the button below:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationUrl}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">Verify Email Address</a>
        </div>
        <p>If the button doesn't work, you can also copy and paste this link into your browser:</p>
        <p style="word-break: break-all; color: #007bff;">${verificationUrl}</p>
        <p>This verification link will expire in 24 hours.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        <p style="color: #666; font-size: 12px;">If you didn't create an account with us, please ignore this email.</p>
      </div>
    `;

    return await this.sendEmail(
      user.email,
      'Welcome! Please verify your email address',
      htmlContent
    );
  }

  async sendPasswordResetEmail(user, resetToken) {
    const resetUrl = `${process.env.BASE_URL || 'http://localhost:3000'}/api/auth/reset-password?token=${resetToken}`;
    
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Password Reset Request</h2>
        <p>Hello ${user.firstName} ${user.lastName},</p>
        <p>We received a request to reset your password for your Network Identity Manager account.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="background-color: #dc3545; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">Reset Password</a>
        </div>
        <p>If the button doesn't work, you can also copy and paste this link into your browser:</p>
        <p style="word-break: break-all; color: #dc3545;">${resetUrl}</p>
        <p>This password reset link will expire in 10 minutes.</p>
        <p><strong>If you didn't request a password reset, please ignore this email and your password will remain unchanged.</strong></p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        <p style="color: #666; font-size: 12px;">For security reasons, this link can only be used once.</p>
      </div>
    `;

    return await this.sendEmail(
      user.email,
      'Password Reset Request - Network Identity Manager',
      htmlContent
    );
  }

  async sendLoginNotification(user, loginInfo) {
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">New Login Detected</h2>
        <p>Hello ${user.firstName} ${user.lastName},</p>
        <p>We detected a new login to your Network Identity Manager account:</p>
        <div style="background-color: #f8f9fa; padding: 15px; border-radius: 4px; margin: 20px 0;">
          <p><strong>Time:</strong> ${new Date(loginInfo.timestamp).toLocaleString()}</p>
          <p><strong>IP Address:</strong> ${loginInfo.ipAddress || 'Unknown'}</p>
          <p><strong>User Agent:</strong> ${loginInfo.userAgent || 'Unknown'}</p>
        </div>
        <p>If this was you, no action is needed. If you don't recognize this login, please contact support immediately.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        <p style="color: #666; font-size: 12px;">This is an automated security notification.</p>
      </div>
    `;

    return await this.sendEmail(
      user.email,
      'New Login Detected - Network Identity Manager',
      htmlContent
    );
  }
}

module.exports = new GraphEmailService();