# 🔐 Curriculo Be - OAuth 2.0/OpenID Connect Integration Test Server

**Integration demonstration and documentation for client systems**

This project provides a comprehensive OAuth 2.0/OpenID Connect integration test server with Keycloak, serving as both a working demonstration and documentation for clients like **curriculo-be** who need to integrate their systems with **Curriculo Be's** authentication infrastructure.

## 🎯 Purpose

This test server demonstrates:
- Complete OAuth 2.0 authentication flow with Keycloak
- Modern web interface with real-time logging
- Session management and security best practices
- Integration patterns for client applications

## 📚 Documentation

### For Client Integration
- **[📖 Complete Integration Guide](CLIENT_INTEGRATION_GUIDE.md)** - Comprehensive documentation for integrating with Curriculo Be's OAuth system
- **[⚙️ Keycloak Configuration](CONFIGURACAO_KEYCLOAK.md)** - Keycloak setup documentation

### Quick Reference
- **Author**: Curriculo Be
- **Target Audience**: Client developers (curriculo-be, etc.)
- **Purpose**: Integration documentation and testing

## 🚀 Features

- ✅ **Complete OAuth 2.0/OpenID Connect Flow** with Keycloak
- ✅ **Modern Web Interface** with control panel
- ✅ **Real-time Logs** via Server-Sent Events
- ✅ **Comprehensive Session Management**
- ✅ **Environment Variable Configuration**
- ✅ **Full English Documentation** with code examples
- ✅ **Security Best Practices** implementation
- ✅ **Error Handling** demonstrations

## 📋 Prerequisites

- Node.js 16+ and npm
- Access to Curriculo Be's Keycloak instance
- Client credentials provided by Curriculo Be

## 🛠️ Quick Start

```bash
# Clone the repository
git clone <repository-url>
cd curriculo-be-redirect-test

# Install dependencies
npm install

# Edit the .env file with your configuration (optional)
# The default values work for testing with Curriculo Be's development environment

# Start the server
npm start
```

The server will start at `http://localhost:3000`


**Option 1: Using .env file (Recommended)**
1. Copy the content from `environment-variables.txt`
2. Create a new file named `.env` in the project root
3. Paste the content and adjust values as needed
4. The application will automatically load these variables

**Option 2: Using system environment variables**
Export the variables in your shell before starting the application.

### Configuration Values

```env
# Curriculo Be Keycloak Configuration
KEYCLOAK_ENDPOINT=https://auth-dev.curriculobe.com.br/realms/bestema-dev
KEYCLOAK_CLIENT_ID=your_client_id_here
KEYCLOAK_CLIENT_SECRET=your_client_secret_here
KEYCLOAK_REDIRECT_URI=http://localhost:3000/callback
KEYCLOAK_LOGOUT_REDIRECT_URI=http://localhost:3000/logout-success
KEYCLOAK_SCOPE=openid profile email

# Server Configuration
PORT=3000
NODE_ENV=development
SESSION_SECRET=your-session-secret-here
```

**Important Notes:**
- For client integration, contact Curriculo Be to get your own credentials
- Never commit `.env` files with real secrets to version control
- Use HTTPS in production (required for OAuth 2.0)
- The `environment-variables.txt` file contains additional configuration options

## 🎯 How to Use

### 1. Access the Control Panel
- Open `http://localhost:3000` in your browser
- You'll see a modern interface with:
  - Application and user status
  - Login/logout buttons
  - Real-time logs console
  - Available endpoints list

### 2. Test the Authentication Flow
1. Click "🔑 Login"
2. You'll be redirected to Curriculo Be's Keycloak
3. Log in with your credentials
4. Return to the panel with updated status
5. Logs will show the complete process in real-time

### 3. Test Logout
1. Click "🚪 Logout" in the panel
2. You'll be redirected to Keycloak logout
3. Return to the logout confirmation page
4. Session will be completely cleared

## 📡 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-----------|
| `/` | GET | Main control panel |
| `/login` | GET | Initiate authentication flow |
| `/callback` | GET | OAuth callback (automatic) |
| `/logout` | GET | Initiate logout process |
| `/logout-success` | GET | Logout confirmation page |
| `/api/status` | GET | Application and user status |
| `/api/logs` | GET | Real-time logs stream |

## 🎨 Web Interface

### Interface Features:
- **Responsive Design** - Works on desktop and mobile
- **Real-time Logs** - Integrated console with Server-Sent Events
- **Visual Status** - Application and user state indicators
- **Intuitive Navigation** - Buttons for all main actions
- **Visual Feedback** - Colors and icons for different log types

### Log Types:
- 🔵 **Info** - General information
- ✅ **Success** - Successful operations
- ❌ **Error** - Errors and failures
- ⚠️ **Warning** - Warnings and alerts

## 🔧 Implementation Highlights

### Security:
- ✅ Environment variables for credentials
- ✅ Improved session system
- ✅ Parameter validation
- ✅ Robust error handling

### Usability:
- ✅ Modern and responsive web interface
- ✅ Real-time logs
- ✅ Visual application status
- ✅ Immediate operation feedback

### Documentation:
- ✅ Complete English docstrings
- ✅ TypeScript interfaces
- ✅ Code examples for integration
- ✅ Comprehensive client guide

## 📝 Project Structure

```
curriculo-be-redirect-test/
├── test-integration.ts              # Main server with full documentation
├── CLIENT_INTEGRATION_GUIDE.md     # Comprehensive integration guide
├── public/
│   └── index.html                   # Web interface
├── CONFIGURACAO_KEYCLOAK.md        # Keycloak configuration
├── package.json                     # Dependencies
├── tsconfig.json                    # TypeScript config
└── README.md                        # This file
```

## 👥 For Client Developers

### Integration Resources:
1. **[Complete Integration Guide](CLIENT_INTEGRATION_GUIDE.md)** - Start here for full integration documentation
2. **Test Server Code** - Reference implementation in `test-integration.ts`
3. **Live Testing** - Use this server to test your integration
4. **Support** - Contact Curriculo Be integration team

### What You'll Learn:
- OAuth 2.0/OpenID Connect flow implementation
- Session management patterns
- Error handling strategies
- Security best practices
- Real-world code examples

## 🐛 Troubleshooting

### Common Issues:
- **Keycloak Connection**: Verify endpoint accessibility and credentials
- **Redirect URI**: Ensure exact match in Keycloak configuration
- **CORS Issues**: Use server-side redirects for OAuth flows
- **Session Problems**: Check cookie configuration and storage

See the [Complete Integration Guide](CLIENT_INTEGRATION_GUIDE.md) for detailed troubleshooting.

## 📞 Support

### For Integration Questions:
- **Documentation**: [Client Integration Guide](CLIENT_INTEGRATION_GUIDE.md)
- **Test Environment**: This repository
- **Technical Support**: Contact Curriculo Be integration team
- **Email**: integration-support@curriculobe.com.br

### Response Times:
- **Integration Questions**: 24-48 hours
- **Support Hours**: Monday-Friday, 9 AM - 6 PM (Brazil time)
- **Emergency**: Production issues only

## 🤝 Contributing

This is an integration documentation project. For improvements:
1. Fork the project
2. Create a feature branch
3. Commit your changes
4. Open a Pull Request

## 📄 License

ISC License - see package.json for details.

---

**© 2024 Curriculo Be - OAuth 2.0/OpenID Connect Integration Documentation** 