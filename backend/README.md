# Pulse-08 Backend

A comprehensive backend service for the Pulse-08 Signals Protocol built on Rootstock blockchain, providing REST API endpoints, WebSocket connections, and blockchain integration.

## 🚀 Features

- **REST API**: Complete RESTful API for markets, positions, users, and analytics
- **WebSocket Support**: Real-time updates for market data and position changes
- **Blockchain Integration**: Direct integration with Rootstock smart contracts
- **The Graph Integration**: Efficient blockchain data querying
- **Rate Limiting**: Built-in rate limiting for API protection
- **Error Handling**: Comprehensive error handling and logging
- **Type Safety**: Full TypeScript implementation with strict typing
- **Security**: Helmet, CORS, and input validation
- **Analytics**: Advanced analytics and reporting capabilities

## 📁 Project Structure

```
src/
├── api/                    # API route handlers
│   ├── markets.ts         # Market-related endpoints
│   ├── positions.ts       # Position-related endpoints
│   ├── users.ts          # User-related endpoints
│   └── analytics.ts      # Analytics endpoints
├── services/              # Business logic services
│   ├── market.ts         # Market service
│   ├── position.ts       # Position service
│   ├── rootstock.ts      # Rootstock blockchain service
│   └── thegraph.ts       # The Graph service
├── utils/                # Utility functions
│   ├── logger.ts         # Winston logging configuration
│   ├── errorHandler.ts   # Error handling middleware
│   ├── rateLimiter.ts    # Rate limiting configuration
│   └── validation.ts     # Input validation schemas
├── types/                # TypeScript type definitions
│   └── market.ts         # Market, position, and user types
└── index.ts              # Main application entry point
```

## 🛠 Installation

1. **Install dependencies**:
   ```bash
   npm install
   # or
   yarn install
   ```

2. **Set up environment variables**:
   ```bash
   cp env.example .env
   # Edit .env with your configuration
   ```

3. **Build the project**:
   ```bash
   npm run build
   ```

## 🚦 Running the Application

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm run build
npm start
```

## 📡 API Endpoints

### Markets
- `GET /api/markets` - Get all markets with filtering
- `GET /api/markets/:id` - Get specific market by ID
- `GET /api/markets/:id/positions` - Get positions for a market
- `GET /api/markets/:id/analytics` - Get market analytics
- `POST /api/markets/:id/settle` - Settle a market (admin only)

### Positions
- `GET /api/positions` - Get all positions with filtering
- `GET /api/positions/:id` - Get specific position by ID
- `GET /api/positions/user/:address` - Get user positions
- `GET /api/positions/user/:address/stats` - Get user position statistics
- `POST /api/positions/open` - Open a new position
- `POST /api/positions/:id/close` - Close a position
- `POST /api/positions/:id/claim` - Claim position rewards

### Users
- `GET /api/users/:address` - Get user profile
- `GET /api/users/:address/stats` - Get user statistics
- `GET /api/users/:address/positions` - Get user positions
- `GET /api/users/:address/portfolio` - Get user portfolio summary
- `GET /api/users/:address/leaderboard` - Get user leaderboard position

### Analytics
- `GET /api/analytics/overview` - Get platform overview
- `GET /api/analytics/markets` - Get market analytics
- `GET /api/analytics/volume` - Get volume analytics
- `GET /api/analytics/users` - Get user analytics
- `GET /api/analytics/performance` - Get performance metrics

### Health Check
- `GET /health` - Application health status

## 🔌 WebSocket API

The backend supports WebSocket connections for real-time updates:

```javascript
const ws = new WebSocket('ws://localhost:3001');

// Subscribe to market updates
ws.send(JSON.stringify({
  type: 'subscribe',
  channel: 'markets'
}));

// Subscribe to position updates for a user
ws.send(JSON.stringify({
  type: 'subscribe',
  channel: 'positions',
  userId: '0x...'
}));
```

## 🏗 Architecture

### Services Layer
- **MarketService**: Handles market-related operations
- **PositionService**: Manages position operations and analytics
- **RootstockService**: Blockchain interaction with smart contracts
- **TheGraphService**: Efficient blockchain data querying

### API Layer
- RESTful endpoints with proper HTTP status codes
- Input validation using Joi schemas
- Rate limiting for API protection
- Comprehensive error handling

### Utilities
- **Logger**: Winston-based logging with different levels
- **ErrorHandler**: Centralized error handling middleware
- **RateLimiter**: Configurable rate limiting
- **Validation**: Input validation schemas

## 🔧 Configuration

### Environment Variables

Key configuration options in `.env`:

```bash
# Server
NODE_ENV=development
BACKEND_PORT=3001
BACKEND_HOST=localhost

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=pulse08

# Rootstock
ROOTSTOCK_RPC_URL=https://public-node.testnet.rsk.co
CONTRACT_DEPLOYER_PRIVATE_KEY=your_private_key

# The Graph
THE_GRAPH_SUBGRAPH_URL=https://api.thegraph.com/subgraphs/name/pulse-08/pulse-08-testnet

# Security
JWT_SECRET=your_jwt_secret
```

### Rate Limiting

Different rate limits for different operations:
- General API: 100 requests per 15 minutes
- Position operations: 20 requests per minute
- Market operations: 30 requests per minute
- Analytics: 50 requests per 5 minutes

## 🔒 Security Features

- **Helmet**: Security headers
- **CORS**: Cross-origin resource sharing
- **Rate Limiting**: Protection against abuse
- **Input Validation**: Comprehensive input sanitization
- **Error Handling**: Secure error responses

## 📊 Monitoring & Logging

- **Winston Logger**: Structured logging with different levels
- **Health Checks**: Application health monitoring
- **Error Tracking**: Comprehensive error logging
- **Performance Metrics**: Request timing and analytics

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

## 📦 Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm test` - Run tests
- `npm run lint` - Lint code
- `npm run lint:fix` - Fix linting issues

## 🔄 Deployment

### Docker Deployment
```bash
# Build Docker image
docker build -t pulse-08-backend .

# Run container
docker run -p 3001:3001 pulse-08-backend
```

### Environment Setup
1. Set up PostgreSQL database
2. Configure Redis cache
3. Deploy smart contracts to Rootstock
4. Set up The Graph subgraph
5. Configure environment variables
6. Deploy application

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the documentation
- Review the API examples

## 🔮 Future Enhancements

- [ ] Database integration for caching
- [ ] Advanced analytics with machine learning
- [ ] Multi-chain support
- [ ] Advanced WebSocket features
- [ ] API versioning
- [ ] GraphQL endpoint
- [ ] Admin dashboard API
- [ ] Notification system
