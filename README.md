# Enhanced-Authentication-API

This project is a Node.js-based authentication system that supports user registration, login, and profile management. It includes features for setting profiles as public or private and allows admin users to view both public and private profiles. The system supports OAuth login with Google.

## Features
 - User registration and login
 - OAuth login with Google
 - User profile management (view, edit, photo upload)
 - Profile visibility settings (public or private)
 - Admin access to all profiles
  - Secure authentication and authorization using JWT
  - API documentation with Swagger

 ### Setup Instructions
 #### Prerequisites
    Node.js
    MongoDB

#### Installation
    Clone the repository:
    git clone <repolink>
 
#### Install dependencies:
    npm install
Create a .env file in the root directory and add the following  environment variables:

    PORT=3000
    MONGODB_URI=your_mongodb_connection_string
    JWT_SECRET=your_jwt_secret
    GOOGLE_CLIENT_ID=your_google_client_id
    GOOGLE_CLIENT_SECRET=your_google_client_secret


#### Start the server:
    node app.js


#### Usage
Access the API at:
http://localhost:3000.

API documentation is available via Swagger. Access it at http://localhost:3000/api-docs.
