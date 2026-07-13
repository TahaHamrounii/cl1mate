# Organic Waste Collection Management System

## Overview

This project is a web-based platform designed to manage the collection of organic waste from hotels in the city of Djerba. The collected waste is transported to a **PNUD methanization facility**, where it is converted into renewable energy.

The platform automates the collection process by integrating with sensors installed at each hotel. These sensors continuously measure both the **weight of the organic waste** and its **organic matter percentage**, allowing the system to make collection decisions without manual input from hotel staff.

The application must be fully responsive and optimized for desktop, tablet, and mobile devices.

---

# Technology Stack

## Frontend
- React
- Vite
- Zone React UI Template (already available in the project root)

## Backend
- Express.js

## Database
- MongoDB

## Maps & Routing
- Leaflet
- Routing engine of your choice (e.g., OSRM, GraphHopper, Leaflet Routing Machine)

---

# User Roles

The platform supports four user roles:

- Hotels
- Municipalities
- PNUD
- Administrator

---

# System Description

Each participating hotel is equipped with:

- A **weight sensor** that measures the quantity of waste available.
- An **organic matter sensor** that measures the percentage of organic material in the waste.

The sensors automatically transmit their readings to the platform. Hotels are **not required to manually enter any waste information**.

Every day, a PNUD collection truck is responsible for collecting organic waste destined for the methanization facility.

The truck has a maximum daily collection capacity of:

**16.7 tons per day**

---

# Waste Acceptance Rules

Waste is accepted by the PNUD collection service only if:

- Organic matter percentage is between **95% and 100%**.
- The daily truck capacity has not been exceeded.

Waste is redirected to the municipality if:

- Organic matter is below **95%**.
- The waste quantity is considered too low (configurable threshold).
- The PNUD truck has already reached its daily capacity of **16.7 tons**.

---

# Hotel Portal

Hotels can monitor their waste collection activity through a dashboard.

Features include:

- Real-time sensor readings.
  - Current waste weight.
  - Organic matter percentage.
- Collection schedule and estimated truck arrival.
- Collection history.
- Total waste collected.
- Monthly and yearly statistics.
- Notifications about completed or upcoming collections.

Hotels do not manually declare waste quantities; all information is received automatically from the installed sensors.

---

# Municipality Portal

Municipalities are responsible for collecting waste that cannot be processed by the PNUD methanization system.

The municipality dashboard includes:

- Hotels assigned to municipal collection.
- Reason for assignment:
  - Organic matter below 95%.
  - Insufficient waste quantity.
  - Daily PNUD capacity reached.
- Interactive map of assigned hotels.
- Suggested optimized collection route.
- Remaining waste statistics.
- Daily and monthly reports.

---

# PNUD Portal

The PNUD dashboard provides:

- Total waste collected today.
- Remaining truck capacity.
- Number of hotels scheduled for collection.
- Organic matter quality statistics.
- Daily, weekly, monthly, and yearly analytics.
- Sensor status monitoring.
- Historical collection reports.

---

# Driver Dashboard

The driver dashboard provides all information required for daily collection.

Features include:

- Interactive Leaflet map.
- Hotel locations.
- Real-time waste weight from sensors.
- Organic matter percentage from sensors.
- Collection status for each hotel.
- Current truck load.
- Remaining truck capacity.
- Estimated arrival times.

The platform automatically computes the optimal collection route by considering:

- Hotel locations.
- Available waste quantity.
- Organic matter quality.
- Maximum truck capacity (16.7 tons).
- Shortest travel distance and time.

Any routing algorithm may be used (e.g., nearest neighbor, shortest path, or another optimization heuristic).

---

# Administrator Portal

The administrator manages the entire system.

Responsibilities include:

- Manage users.
- Manage hotels.
- Manage municipalities.
- Manage PNUD accounts.
- Configure system parameters.
- Configure waste quantity thresholds.
- Monitor sensor status.
- View global statistics.
- Access system reports.
- Manage permissions.

---

# General Features

- Responsive design.
- Role-based authentication and authorization.
- Interactive dashboards.
- Leaflet-based maps.
- Automatic sensor integration.
- Collection history.
- Statistical reports and charts.
- Notifications.
- Route optimization.
- REST API using Express.js.
- MongoDB database.
- Modern UI using the Zone React template.

---

# Business Rules

1. Each hotel automatically sends waste data using connected sensors.
2. Hotels do not manually declare waste quantities or quality.
3. The truck can collect a maximum of **16.7 tons per day**.
4. Waste must contain between **95% and 100% organic matter** to be accepted by the methanization facility.
5. Waste below the quality threshold is assigned to the municipality.
6. If the daily capacity has been reached, remaining hotels are assigned to municipal collection.
7. Hotels with waste quantities below the configured minimum threshold may also be assigned to municipal collection.
8. Every collection is recorded and included in the platform's analytics and reports.