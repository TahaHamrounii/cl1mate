# Create Express Project Structure for Waste Collection Management System

The goal of this task is to initialize and build a robust Express.js backend project structure inside the `/backend` directory. This backend will serve as the REST API for the Organic Waste Collection Management System, supporting role-based authentication, real-time sensor updates, collection route optimization, and dashboard statistics for different user roles (Hotels, Municipalities, PNUD, Administrator).

## User Review Required

> [!IMPORTANT]
> The backend structure will use Node.js, Express, Mongoose (MongoDB), JSON Web Tokens (JWT) for authentication, and bcryptjs for password hashing.
> If you have specific preferences regarding project structure (e.g., nesting inside `src/` versus putting them at the root level), please let me know. By default, I will organize application files inside a `src/` directory to keep the root level clean.

## Open Questions

- **Driver Account Role**: The documentation mentions a "Driver Dashboard". Is the Driver a separate role, or is it a sub-role under PNUD/Municipality? I will assume it's a separate role (`driver`) in the database schemas to support driver-specific dashboard endpoints.
- **MongoDB Connection**: Do you have a local MongoDB connection string or a MongoDB Atlas URI you would like to use? I will default to `mongodb://localhost:27017/cl1mate` in the template `.env` file.

## Proposed Changes

### Backend Base Setup

Setup of initialization files, dependencies, and configuration templates in the `backend/` directory.

---

#### [NEW] [package.json](file:///c:/Users/tahah/Desktop/cl1mate/backend/package.json)
Initializes backend configuration and imports core dependencies (`express`, `mongoose`, `cors`, `dotenv`, `bcryptjs`, `jsonwebtoken`, `morgan`) and development tools (`nodemon`).

#### [NEW] [server.js](file:///c:/Users/tahah/Desktop/cl1mate/backend/src/server.js)
The entry point of the Express application. Configures database connection, handles CORS and JSON parsers, registers routes, and handles global errors.

#### [NEW] [.env](file:///c:/Users/tahah/Desktop/cl1mate/backend/.env)
Contains development configuration template for port, database URI, and JWT secrets.

#### [NEW] [.gitignore](file:///c:/Users/tahah/Desktop/cl1mate/backend/.gitignore)
Standard ignore pattern for `node_modules` and environment files.

### Configuration and Middleware

---

#### [NEW] [db.js](file:///c:/Users/tahah/Desktop/cl1mate/backend/src/config/db.js)
Mongoose connection config for connecting to MongoDB.

#### [NEW] [auth.js](file:///c:/Users/tahah/Desktop/cl1mate/backend/src/middleware/auth.js)
Middleware to verify JWT authentication and enforce role-based access control (Admin, Hotel, PNUD, Municipality, Driver).

#### [NEW] [errorHandler.js](file:///c:/Users/tahah/Desktop/cl1mate/backend/src/middleware/errorHandler.js)
Centralized Express error handling middleware.

### Database Models

---

#### [NEW] [User.js](file:///c:/Users/tahah/Desktop/cl1mate/backend/src/models/User.js)
Mongoose schema for system users. Includes email, password, name, phone, and role (`admin`, `hotel`, `pnud`, `municipality`, `driver`).

#### [NEW] [Hotel.js](file:///c:/Users/tahah/Desktop/cl1mate/backend/src/models/Hotel.js)
Mongoose schema for hotels. Tracks hotel location (lat, lng), current sensor readings (weight, organic matter %), sensor status, and associated User ID.

#### [NEW] [SensorReading.js](file:///c:/Users/tahah/Desktop/cl1mate/backend/src/models/SensorReading.js)
Mongoose schema to store chronological logs of sensor readings for charts, history, and analytics.

#### [NEW] [CollectionRecord.js](file:///c:/Users/tahah/Desktop/cl1mate/backend/src/models/CollectionRecord.js)
Tracks collection actions: hotel, driver, weight collected, organic matter percentage, collection date, status (`pending`, `completed`, `redirected`), and collector (`pnud`, `municipality`).

#### [NEW] [SystemConfig.js](file:///c:/Users/tahah/Desktop/cl1mate/backend/src/models/SystemConfig.js)
Mongoose schema to store system parameters like standard organic waste percentage threshold (e.g. 95%), low waste weight threshold, and maximum daily truck capacity (16.7 tons).

### Routing and Controllers

---

#### [NEW] [authController.js](file:///c:/Users/tahah/Desktop/cl1mate/backend/src/controllers/authController.js) and [auth.js](file:///c:/Users/tahah/Desktop/cl1mate/backend/src/routes/auth.js)
Endpoints for authentication (register user, login, verify user).

#### [NEW] [hotelController.js](file:///c:/Users/tahah/Desktop/cl1mate/backend/src/controllers/hotelController.js) and [hotels.js](file:///c:/Users/tahah/Desktop/cl1mate/backend/src/routes/hotels.js)
Endpoints for hotels to view sensor details, schedules, and historical collections.

#### [NEW] [sensorController.js](file:///c:/Users/tahah/Desktop/cl1mate/backend/src/controllers/sensorController.js) and [sensors.js](file:///c:/Users/tahah/Desktop/cl1mate/backend/src/routes/sensors.js)
Endpoints simulating sensor telemetry updates (weight and organic matter) to update hotel readings dynamically.

#### [NEW] [collectionController.js](file:///c:/Users/tahah/Desktop/cl1mate/backend/src/controllers/collectionController.js) and [collections.js](file:///c:/Users/tahah/Desktop/cl1mate/backend/src/routes/collections.js)
Endpoints to fetch daily routing optimization schedules, check truck capacity, log collections, and view statistics for PNUD, municipalities, and drivers.

#### [NEW] [adminController.js](file:///c:/Users/tahah/Desktop/cl1mate/backend/src/controllers/adminController.js) and [admin.js](file:///c:/Users/tahah/Desktop/cl1mate/backend/src/routes/admin.js)
Endpoints for system parameters, managing user creation, monitoring system status.

### Utilities

---

#### [NEW] [routeOptimizer.js](file:///c:/Users/tahah/Desktop/cl1mate/backend/src/utils/routeOptimizer.js)
Heuristic algorithm to optimize the waste collection route (e.g., nearest neighbor or capacity-constrained path optimization).

## Verification Plan

### Automated Tests
- Test syntax correctness and load tests using standard Node checks.
- We will install project dependencies and execute `node --check src/server.js` or run `npm run dev` to ensure server starts without crashes.

### Manual Verification
- Verify the server loads environment variables successfully and connects to the database (logs: `MongoDB connected...`).
- Verify endpoints return appropriate JSON structures using test queries (using standard tools or postman/curl if needed).
