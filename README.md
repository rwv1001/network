# Network Identity Manager

A modern identity management system with Microsoft Graph email integration and Docker Compose deployment.

## Features

- **User Management**: Complete user registration, authentication, and profile management
- **Microsoft Graph Integration**: Email functionality powered by Microsoft Graph (no SMTP)
- **Security**: JWT authentication, bcrypt password hashing, rate limiting, and security headers
- **Docker Deployment**: Full containerized deployment with Docker Compose
- **Database**: MongoDB for data persistence
- **Reverse Proxy**: Nginx for load balancing and security
- **Logging**: Structured logging with Winston
- **Validation**: Input validation with Joi
- **Network Access Control**: MAC address-based device blocking and VLAN assignment for unregistered devices

## Architecture

- **Application**: Node.js/Express API server
- **Database**: MongoDB for user data storage
- **Reverse Proxy**: Nginx for routing and security
- **Email Service**: Microsoft Graph API integration
- **Containerization**: Docker containers orchestrated with Docker Compose
- **Network Access Control**: MAC address-based device registration and VLAN assignment

## Quick Start

### Prerequisites

- Docker and Docker Compose
- Microsoft Azure account with Graph API access
- Azure App Registration for Graph API

### Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd network
   ```

2. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Update the `.env` file with your Azure credentials:
   ```
   JWT_SECRET=your-super-secret-jwt-key-change-in-production
   AZURE_CLIENT_ID=your-azure-client-id
   AZURE_CLIENT_SECRET=your-azure-client-secret
   AZURE_TENANT_ID=your-azure-tenant-id
   ```

3. **Deploy with Docker Compose**
   ```bash
   docker-compose up -d
   ```

4. **Access the application**
   - API: http://localhost:3000
   - Health check: http://localhost:3000/health

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/verify-email?token=<token>` - Email verification
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password

### User Management
- `GET /api/users/profile` - Get current user profile
- `PUT /api/users/profile` - Update user profile
- `PUT /api/users/password` - Change password
- `GET /api/users` - List all users (admin only)
- `GET /api/users/:id` - Get user by ID (admin only)
- `PUT /api/users/:id/role` - Update user role (admin only)
- `PUT /api/users/:id/activate` - Activate user (admin only)
- `PUT /api/users/:id/deactivate` - Deactivate user (admin only)

### Device Management (Network Access Control)
- `GET /api/devices/status/:macAddress` - Check device registration status (for network equipment)
- `POST /api/devices/register` - Register a new device
- `GET /api/devices/my-devices` - Get current user's registered devices
- `DELETE /api/devices/:deviceId` - Unregister a device
- `GET /api/devices/admin/all` - List all devices (admin only)
- `PUT /api/devices/admin/:macAddress/block` - Block/unblock device (admin only)

## Microsoft Graph Setup

1. **Create Azure App Registration**
   - Go to Azure Portal → App registrations
   - Create new registration
   - Note the Application (client) ID and Directory (tenant) ID

2. **Create Client Secret**
   - In your app registration, go to Certificates & secrets
   - Create new client secret
   - Copy the secret value

3. **Configure API Permissions**
   - Add Microsoft Graph permissions:
     - `Mail.Send` (Application permission)
   - Grant admin consent

4. **Update Environment Variables**
   ```
   AZURE_CLIENT_ID=<your-client-id>
   AZURE_CLIENT_SECRET=<your-client-secret>
   AZURE_TENANT_ID=<your-tenant-id>
   ```

## Email Features

The system sends emails for:
- Welcome emails with email verification links
- Password reset emails
- Login notification emails

All emails are sent via Microsoft Graph API with no SMTP fallback.

## Security Features

- JWT token authentication
- Password hashing with bcrypt
- Account lockout after failed login attempts
- Rate limiting on API endpoints
- Security headers via Helmet
- Input validation with Joi
- CORS protection

## Development

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Start development server**
   ```bash
   npm run dev
   ```

3. **Run tests**
   ```bash
   npm test
   ```

4. **Lint code**
   ```bash
   npm run lint
   ```

## Production Deployment

1. **Set environment to production**
   ```
   NODE_ENV=production
   ```

2. **Use strong JWT secret**
   ```
   JWT_SECRET=<strong-random-secret>
   ```

3. **Configure SSL certificates** (optional)
   - Place certificates in `ssl/` directory
   - Uncomment HTTPS section in nginx.conf

4. **Deploy**
   ```bash
   docker-compose -f docker-compose.yml up -d
   ```

## Monitoring

- Health check endpoint: `/health`
- Application logs are available via Docker logs
- MongoDB metrics available through MongoDB tools

## Network Access Control

For detailed information about MAC address blocking, firewall rules, and VLAN-based access control for unregistered devices, see [NETWORK_ACCESS_CONTROL.md](./NETWORK_ACCESS_CONTROL.md).

### Key Features:
- **MAC Address Registration**: Devices must be registered to access production networks
- **Automatic VLAN Assignment**: Unregistered devices are placed in a restricted guest VLAN
- **Firewall Integration**: Dynamic firewall rules based on device registration status
- **Registration Portal**: Web interface for users to register their devices

## License

MIT License
