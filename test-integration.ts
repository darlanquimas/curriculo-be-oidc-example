/**
 * @fileoverview OAuth 2.0/OpenID Connect integration test server with Keycloak
 * 
 * This server provides a complete OAuth 2.0 authentication flow demonstration
 * with Keycloak, including a modern web interface and real-time logging.
 * It serves as integration documentation for clients like curriculo-be to integrate
 * their systems with Curriculo Be's authentication infrastructure.
 * 
 * @author Curriculo Be
 * @version 1.0.0
 * @since 2024
 * 
 * Features:
 * - Complete OAuth 2.0/OpenID Connect flow
 * - Modern web interface with real-time logs
 * - Session management
 * - Environment variable configuration
 * - RESTful API endpoints
 * - Server-Sent Events for real-time updates
 */

// Load environment variables from .env file
import 'dotenv/config';

import { Request, Response } from 'express';
import axios from 'axios';
import { URLSearchParams } from 'url';
import * as path from 'path';
import * as fs from 'fs';

const express = require('express');

/**
 * Keycloak OAuth 2.0 configuration interface
 * All values can be overridden using environment variables
 */
const keycloakConfig = {
  /** Keycloak realm endpoint URL */
  endpoint: process.env.KEYCLOAK_ENDPOINT || 'https://auth-dev.curriculobe.com.br/realms/bestema-dev',
  /** OAuth 2.0 client identifier */
  clientId: process.env.KEYCLOAK_CLIENT_ID || '',
  /** OAuth 2.0 client secret */
  clientSecret: process.env.KEYCLOAK_CLIENT_SECRET || '',
  /** Callback URI after successful authentication */
  redirectUri: process.env.KEYCLOAK_REDIRECT_URI || 'http://localhost:3000/callback',
  /** Redirect URI after successful logout */
  logoutRedirectUri: process.env.KEYCLOAK_LOGOUT_REDIRECT_URI || 'http://localhost:3000/logout-success',
  /** OAuth 2.0 scope string for requesting user information */
  scope: process.env.KEYCLOAK_SCOPE || 'openid profile email',
};

/**
 * Express application instance
 */
const app = express();

/**
 * Server port configuration
 */
const PORT = process.env.PORT || 3000;

// Middleware configuration
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/**
 * Log entry interface for structured logging
 * Used for both console output and real-time web interface updates
 */
interface LogEntry {
  /** Timestamp when the log entry was created */
  timestamp: Date;
  /** Log message content */
  message: string;
  /** Log level/type for categorization and styling */
  type: 'info' | 'success' | 'error' | 'warning';
}

/**
 * In-memory log storage
 * Maintains the last 100 log entries for real-time display
 */
let logs: LogEntry[] = [];

/**
 * Active Server-Sent Events connections for real-time log streaming
 */
let logClients: Response[] = [];

/**
 * Adds a new log entry and broadcasts it to connected clients
 * 
 * @param message - The log message to record
 * @param type - The log level/type (defaults to 'info')
 * 
 * @example
 * ```typescript
 * addLog('User authentication successful', 'success');
 * addLog('Failed to connect to Keycloak', 'error');
 * ```
 */
function addLog(message: string, type: LogEntry['type'] = 'info') {
  const logEntry: LogEntry = {
    timestamp: new Date(),
    message,
    type
  };
  
  // Add to logs array
  logs.push(logEntry);
  
  // Maintain only last 100 entries to prevent memory issues
  if (logs.length > 100) {
    logs = logs.slice(-100);
  }
  
  // Broadcast to connected SSE clients
  const logData = JSON.stringify({
    timestamp: logEntry.timestamp.toISOString(),
    message: logEntry.message,
    type: logEntry.type
  });
  
  logClients.forEach(client => {
    try {
      client.write(`data: ${logData}\n\n`);
    } catch (error) {
      // Client disconnected, will be cleaned up on next request
    }
  });
  
  // Console output with emoji indicators
  const timestamp = logEntry.timestamp.toLocaleTimeString();
  const emoji = {
    info: 'ℹ️',
    success: '✅',
    error: '❌',
    warning: '⚠️'
  }[type];
  
  console.log(`${emoji} [${timestamp}] ${message}`);
}

/**
 * User session interface for storing OAuth tokens and user information
 * Each session is identified by a unique session ID
 */
interface UserSession {
  /** JWT ID token containing user identity claims */
  idToken?: string;
  /** OAuth 2.0 access token for API calls */
  accessToken?: string;
  /** OAuth 2.0 refresh token for token renewal */
  refreshToken?: string;
  /** User profile information from UserInfo endpoint */
  userInfo?: any;
  /** Session authentication status */
  isAuthenticated: boolean;
}

/**
 * In-memory session storage
 * Maps session IDs to user session data
 */
const sessions: Map<string, UserSession> = new Map();

/**
 * Generates a cryptographically random session identifier
 * 
 * @returns A unique session ID string
 * 
 * @example
 * ```typescript
 * const sessionId = generateSessionId();
 * // Returns: "abc123def456ghi789"
 * ```
 */
function generateSessionId(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

/**
 * Extracts session ID from request headers or cookies
 * Falls back to 'default' if no session ID is found
 * 
 * @param req - Express request object
 * @returns Session ID string
 * 
 * @example
 * ```typescript
 * const sessionId = getSessionId(req);
 * const userSession = sessions.get(sessionId);
 * ```
 */
function getSessionId(req: Request): string {
  // Try to get session ID from cookie
  const cookieHeader = req.headers.cookie;
  if (cookieHeader) {
    const cookies = cookieHeader.split(';').map(c => c.trim());
    const sessionCookie = cookies.find(c => c.startsWith('sessionId='));
    if (sessionCookie) {
      return sessionCookie.split('=')[1];
    }
  }
  
  // Fallback to authorization header or default
  return req.headers.authorization || 'default';
}

// Static file serving middleware
app.use('/public', express.static(path.join(__dirname, 'public')));

/**
 * Main dashboard route
 * Serves the control panel interface or a fallback HTML page
 * 
 * @route GET /
 * @returns HTML control panel interface
 */
app.get('/', (req: Request, res: Response) => {
  const htmlPath = path.join(__dirname, 'public', 'index.html');
  
  if (fs.existsSync(htmlPath)) {
    res.sendFile(htmlPath);
  } else {
    // Fallback HTML if main interface file is missing
    res.send(`
      <html>
        <head><title>curriculo-be Redirect Test</title></head>
        <body>
          <h1>🔐 curriculo-be Redirect Test</h1>
          <p>Main HTML interface file not found.</p>
          <a href="/login">Login</a> | <a href="/logout">Logout</a>
        </body>
      </html>
    `);
  }
  
  addLog('📱 Main dashboard accessed', 'info');
});

/**
 * Real-time logs endpoint using Server-Sent Events
 * Streams log entries to connected clients in real-time
 * 
 * @route GET /api/logs
 * @returns Server-Sent Events stream of log entries
 * 
 * @example
 * JavaScript client:
 * ```javascript
 * const eventSource = new EventSource('/api/logs');
 * eventSource.onmessage = function(event) {
 *   const logEntry = JSON.parse(event.data);
 *   console.log(logEntry.message);
 * };
 * ```
 */
app.get('/api/logs', (req: Request, res: Response) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Cache-Control'
  });

  // Add client to active connections
  logClients.push(res);
  
  // Send existing logs to new client
  logs.forEach(log => {
    const logData = JSON.stringify({
      timestamp: log.timestamp.toISOString(),
      message: log.message,
      type: log.type
    });
    res.write(`data: ${logData}\n\n`);
  });

  // Clean up on client disconnect
  req.on('close', () => {
    logClients = logClients.filter(client => client !== res);
    addLog('📱 Log client disconnected', 'info');
  });

  addLog('📱 Log client connected', 'success');
});

/**
 * Application and user status endpoint
 * Returns current server status and user authentication information
 * 
 * @route GET /api/status
 * @returns JSON object with server and user status
 * 
 * @example
 * Response:
 * ```json
 * {
 *   "server": "🟢 Server Online",
 *   "user": "🟢 Authenticated (john.doe)",
 *   "userInfo": { "preferred_username": "john.doe", "email": "john@example.com" },
 *   "timestamp": "2024-01-01T12:00:00.000Z",
 *   "sessions": 1,
 *   "logs": 15,
 *   "sessionId": "abc123..."
 * }
 * ```
 */
app.get('/api/status', (req: Request, res: Response) => {
  const sessionId = getSessionId(req);
  const userSession = sessions.get(sessionId) || { isAuthenticated: false };
  
  let userStatus = '❌ Not Authenticated';
  let userInfo = null;
  
  if (userSession.isAuthenticated) {
    if (userSession.userInfo) {
      const username = userSession.userInfo.preferred_username || userSession.userInfo.email || 'User';
      userStatus = `🟢 Authenticated (${username})`;
      userInfo = userSession.userInfo;
    } else {
      userStatus = '🟢 Authenticated';
    }
  }
  
  res.json({
    server: '🟢 Server Online',
    user: userStatus,
    userInfo: userInfo,
    timestamp: new Date().toISOString(),
    sessions: sessions.size,
    logs: logs.length,
    sessionId: sessionId
  });
  
  addLog(`📊 Status checked for session: ${sessionId.substring(0, 8)}...`, 'info');
});

/**
 * OAuth 2.0 authorization initiation endpoint
 * Redirects user to Keycloak authorization server for authentication
 * 
 * @route GET /login
 * @returns Redirect to Keycloak authorization endpoint
 * 
 * Flow:
 * 1. Constructs authorization URL with required parameters
 * 2. Redirects user to Keycloak login page
 * 3. User authenticates with Keycloak
 * 4. Keycloak redirects back to /callback with authorization code
 */
app.get('/login', (req: Request, res: Response) => {
  const authUrl =
    `${keycloakConfig.endpoint}/protocol/openid-connect/auth?` +
    `client_id=${keycloakConfig.clientId}&` +
    `redirect_uri=${encodeURIComponent(keycloakConfig.redirectUri)}&` +
    `response_type=code&` +
    `scope=${encodeURIComponent(keycloakConfig.scope)}`;

  addLog('🔑 Redirecting to Keycloak for authentication...', 'info');
  res.redirect(authUrl);
});

/**
 * OAuth 2.0 authorization callback endpoint
 * Handles the authorization code received from Keycloak after user authentication
 * 
 * @route GET /callback
 * @param code - Authorization code from Keycloak (query parameter)
 * @returns Redirect to main dashboard with authentication status
 * 
 * Flow:
 * 1. Receives authorization code from Keycloak
 * 2. Exchanges code for access tokens
 * 3. Fetches user information using access token
 * 4. Creates user session and sets session cookie
 * 5. Redirects to main dashboard
 * 
 * @example
 * Keycloak calls: GET /callback?code=abc123...&state=xyz789...
 */
app.get('/callback', async (req: Request, res: Response): Promise<any> => {
  const authCode = req.query.code as string;
  let sessionId = getSessionId(req);
  
  // Generate new session ID if none exists
  if (sessionId === 'default') {
    sessionId = generateSessionId();
  }

  if (!authCode) {
    addLog('❌ Authorization code not found in callback', 'error');
    return res.redirect('/?error=no_auth_code');
  }

  addLog(`🔄 Authorization code received: ${authCode.substring(0, 20)}...`, 'success');
  addLog('🔄 Exchanging code for access tokens...', 'info');

  const tokenEndpoint = `${keycloakConfig.endpoint}/protocol/openid-connect/token`;

  const params = new URLSearchParams();
  params.append('grant_type', 'authorization_code');
  params.append('client_id', keycloakConfig.clientId);
  params.append('client_secret', keycloakConfig.clientSecret);
  params.append('code', authCode);
  params.append('redirect_uri', keycloakConfig.redirectUri);

  try {
    const tokenResponse = await axios.post(tokenEndpoint, params, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    addLog('🎉 Tokens received successfully!', 'success');

    // Store user session data
    const userSession: UserSession = {
      idToken: tokenResponse.data.id_token,
      accessToken: tokenResponse.data.access_token,
      refreshToken: tokenResponse.data.refresh_token,
      isAuthenticated: true
    };

    sessions.set(sessionId, userSession);

    // Fetch user information using access token
    try {
      const userInfoResponse = await axios.get(
        `${keycloakConfig.endpoint}/protocol/openid-connect/userinfo`,
        {
          headers: {
            'Authorization': `Bearer ${tokenResponse.data.access_token}`
          }
        }
      );
      
      userSession.userInfo = userInfoResponse.data;
      addLog(`👤 User authenticated: ${userInfoResponse.data.preferred_username || userInfoResponse.data.email}`, 'success');
    } catch (userInfoError) {
      addLog('⚠️ Could not fetch user information', 'warning');
    }

    // Redirect to main dashboard after successful authentication
    addLog('✅ Authentication completed! Redirecting to main page...', 'success');
    
    // Set session cookie
    res.setHeader('Set-Cookie', `sessionId=${sessionId}; HttpOnly; Path=/; Max-Age=86400`);
    res.redirect('/?auth=success');

  } catch (error: any) {
    const errorMsg = error.response?.data?.error_description || error.response?.data || error.message;
    addLog(`❌ Error obtaining tokens: ${errorMsg}`, 'error');
    
    // Redirect to main page with error indication
    res.redirect('/?error=auth_failed');
  }
});

/**
 * OAuth 2.0 logout initiation endpoint
 * Redirects user to Keycloak logout endpoint and cleans up local session
 * 
 * @route GET /logout
 * @returns Redirect to Keycloak logout endpoint
 * 
 * Flow:
 * 1. Checks if user has an active session
 * 2. Constructs logout URL with optional ID token hint
 * 3. Clears local session data and cookies
 * 4. Redirects to Keycloak for single sign-out
 * 5. Keycloak redirects back to logout success page
 */
app.get('/logout', (req: Request, res: Response) => {
  const sessionId = getSessionId(req);
  const userSession = sessions.get(sessionId);

  if (!userSession || !userSession.isAuthenticated) {
    addLog('⚠️ Logout attempt without active session', 'warning');
    return res.redirect('/logout-success');
  }

  const logoutUrl = 
    `${keycloakConfig.endpoint}/protocol/openid-connect/logout?` +
    `client_id=${keycloakConfig.clientId}&` +
    `post_logout_redirect_uri=${encodeURIComponent(keycloakConfig.logoutRedirectUri)}` +
    (userSession.idToken ? `&id_token_hint=${userSession.idToken}` : '');

  addLog('🚪 Redirecting to Keycloak for logout...', 'info');
  
  // Clear session data
  sessions.delete(sessionId);
  
  // Clear session cookie
  res.setHeader('Set-Cookie', 'sessionId=; HttpOnly; Path=/; Max-Age=0');
  res.redirect(logoutUrl);
});

/**
 * Logout success confirmation page
 * Displays a confirmation page after successful logout from Keycloak
 * 
 * @route GET /logout-success
 * @returns HTML confirmation page with navigation options
 */
app.get('/logout-success', (req: Request, res: Response) => {
  addLog('✅ Logout completed successfully!', 'success');
  
  res.status(200).send(`
    <html>
      <head>
        <title>Logout Successful - curriculo-be Redirect Test</title>
        <style>
          body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            justify-content: center;
            align-items: center;
            margin: 0;
            padding: 20px;
          }
          .container { 
            background: white;
            max-width: 500px; 
            margin: 0 auto; 
            padding: 40px; 
            border-radius: 15px;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
            text-align: center;
          }
          .success { 
            color: #28a745; 
            font-size: 2em;
            margin-bottom: 20px;
          }
          .message {
            color: #666;
            font-size: 1.1em;
            margin-bottom: 30px;
          }
          .btn { 
            background: linear-gradient(135deg, #007bff, #0056b3);
            color: white; 
            padding: 12px 24px; 
            text-decoration: none; 
            border-radius: 8px; 
            display: inline-block; 
            font-weight: 600;
            transition: all 0.3s ease;
          }
          .btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 20px rgba(0, 123, 255, 0.3);
          }
          .home-btn {
            background: linear-gradient(135deg, #28a745, #1e7e34);
            margin-left: 10px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="success">✅ Logout Successful!</div>
          <div class="message">
            You have been successfully logged out of the system.<br>
            Your session has been terminated in Keycloak.
          </div>
          <a href="/login" class="btn">🔑 Login Again</a>
          <a href="/" class="btn home-btn">🏠 Back to Home</a>
        </div>
      </body>
    </html>
  `);
});

/**
 * Global error handling middleware
 * Catches and logs unhandled errors, returning a standardized error response
 * 
 * @param error - The error object
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Next middleware function
 */
app.use((error: any, req: Request, res: Response, next: any) => {
  addLog(`❌ Internal server error: ${error.message}`, 'error');
  res.status(500).json({
    error: 'Internal server error',
    message: error.message,
    timestamp: new Date().toISOString()
  });
});

/**
 * Server initialization and startup
 * Starts the Express server and logs configuration information
 */
app.listen(PORT, () => {
  addLog(`🚀 Test server started at http://localhost:${PORT}`, 'success');
  addLog(`👉 Access control panel: http://localhost:${PORT}`, 'info');
  addLog(`🔑 Login endpoint: http://localhost:${PORT}/login`, 'info');
  addLog(`🚪 Logout endpoint: http://localhost:${PORT}/logout`, 'info');
  addLog(`📊 Status endpoint: http://localhost:${PORT}/api/status`, 'info');
  addLog(`📋 Real-time logs: http://localhost:${PORT}/api/logs`, 'info');
  
  console.log('\n=== KEYCLOAK CONFIGURATION ===');
  console.log(`Endpoint: ${keycloakConfig.endpoint}`);
  console.log(`Client ID: ${keycloakConfig.clientId}`);
  console.log(`Redirect URI: ${keycloakConfig.redirectUri}`);
  console.log(`Logout Redirect URI: ${keycloakConfig.logoutRedirectUri}`);
  console.log('================================\n');
});