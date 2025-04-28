# School Payment System

A robust backend system for handling school fee payments, processing webhook notifications, and managing transaction records.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [System Architecture](#system-architecture)
- [Installation](#installation)
- [Environment Configuration](#environment-configuration)
- [API Endpoints](#api-endpoints)
- [Testing](#testing)
- [Error Handling](#error-handling)
- [Security](#security)

## Overview

This application provides a NestJS-based REST API for initiating school fee payments, handling payment gateway callbacks via webhooks, and querying transaction statuses. It integrates with a payment gateway API to facilitate secure transactions.

## Features

- **User Authentication**: JWT-based authentication with secure password handling
- **Payment Initiation**: API to create payment orders and redirect to payment gateway
- **Webhook Processing**: Asynchronous handling of payment gateway callbacks
- **Transaction Management**: APIs to query transaction statuses and history
- **Error Handling**: Comprehensive error handling with appropriate HTTP responses
- **Data Validation**: Input validation using class-validator
- **MongoDB Integration**: Persistent data storage with Mongoose ODM

## System Architecture

### Core Modules

- **Auth Module**: Handles user registration, authentication, and JWT management
- **Orders Module**: Manages payment orders, initiates payments, and tracks transaction status
- **Webhooks Module**: Processes payment gateway callbacks and updates order statuses
- **Users Module**: Handles user account management and data access

### Database Schema

- **User**: Stores user credentials and authentication details
- **Order**: Records payment orders with student information and amount details
- **OrderStatus**: Tracks payment statuses from webhook callbacks
- **WebhookLog**: Records all incoming webhook payloads for audit and debugging

## Installation

### Prerequisites

- Node.js (v16+)
- MongoDB (v5+)
- npm or yarn package manager

### Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/school-payment-assessment.git
   cd school-payment-assessment/backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables (see [Environment Configuration](#environment-configuration))

4. Start the development server:
   ```bash
   npm run start:dev
   ```

5. The API will be available at `http://localhost:3000`

## Environment Configuration

Create a `.env` file in the backend directory with the following variables:

```
# MongoDB Configuration
MONGO_URI=mongodb+srv://<USERNAME>:<PASSWORD>@<CLUSTER>.mongodb.net/<DATABASE>?retryWrites=true&w=majority

# JWT Configuration
JWT_SECRET=your_strong_jwt_secret_key
JWT_EXPIRATION_TIME=3600s

# Payment Gateway API Credentials
PAYMENT_PG_KEY=your_payment_pg_key
PAYMENT_API_KEY=your_payment_api_key
PAYMENT_SCHOOL_ID=your_school_id
PAYMENT_API_BASE_URL=https://dev-vanilla.edviron.com/erp
PAYMENT_PG_SECRET_KEY=your_payment_pg_secret_key

# Optional: Application Port
PORT=3000
```

## API Endpoints

### Authentication

#### Register

```
POST /auth/register
Content-Type: application/json

{
  "username": "testuser",
  "password": "securepassword123",
  "email": "user@example.com"
}
```

#### Login

```
POST /auth/login
Content-Type: application/json

{
  "username": "testuser",
  "password": "securepassword123"
}
```

Response:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Orders & Payments

#### Create Payment

```
POST /orders/create-payment
Authorization: Bearer {token}
Content-Type: application/json

{
  "school_id": "school123",
  "student_info": {
    "name": "Jane Doe",
    "id": "STU12345",
    "email": "student@example.com"
  },
  "amount": 1000,
  "callback_url": "https://yourapp.com/payment/callback"
}
```

Response:
```json
{
  "paymentRedirectUrl": "https://payment-gateway.com/pay/abc123",
  "collectRequestId": "req12345"
}
```

#### Get All Transactions

```
GET /orders/transactions?page=1&limit=10&sort=payment_time&order=desc
Authorization: Bearer {token}
```

#### Get Transactions by School

```
GET /orders/transactions/school/school123?page=1&limit=10
Authorization: Bearer {token}
```

#### Get Transaction Status

```
GET /orders/transaction-status/60f1a5c9e6b3f32a48b83a1c
Authorization: Bearer {token}
```

### Webhooks

#### Payment Webhook

```
POST /webhooks/payment
Content-Type: application/json

{
  "order_info": {
    "order_id": "60f1a5c9e6b3f32a48b83a1c/txn12345",
    "order_amount": 1000,
    "transaction_amount": 1000,
    "payment_mode": "UPI",
    "payment_details": "details",
    "bank_reference": "REF123456",
    "payment_message": "Success",
    "status": "SUCCESS",
    "error_message": "NA",
    "payment_time": "2023-07-16T10:15:30Z"
  }
}
```

## Testing

### Using Postman

Download the [Postman Collection](https://link-to-your-postman-collection) to test the API endpoints.

Import the collection into Postman and configure the environment variables:
- `baseUrl`: Your API base URL (default: http://localhost:3000)
- `token`: The JWT token received from the login endpoint

### Running Tests

Execute the test suite:
```bash
npm test
```

Run end-to-end tests:
```bash
npm run test:e2e
```

## Error Handling

The API implements consistent error handling with appropriate HTTP status codes:

- `400 Bad Request`: Invalid input data
- `401 Unauthorized`: Missing or invalid authentication
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `500 Internal Server Error`: Server-side issues

## Security

- All passwords are hashed using bcrypt
- API routes are protected with JWT authentication
- Input data is validated before processing
- Sensitive environment variables are required for operation
- Webhook processing is performed asynchronously to prevent timeouts