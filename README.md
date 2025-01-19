# **NamEdu Backend**

🚀 **NamEdu.uz Backend** – Backend service built with **Node.js**, **Express.js**, and **MongoDB**

---

## **Table of Contents**

- [**NamEdu Backend**](#namedu-backend)
  - [**Table of Contents**](#table-of-contents)
  - [**Project Overview**](#project-overview)
  - [**Tech Stack**](#tech-stack)
  - [**Prerequisites**](#prerequisites)
  - [**Installation**](#installation)
  - [**Configuration**](#configuration)
  - [**Running the Project**](#running-the-project)
  - [**API Documentation**](#api-documentation)
  - [📝 **Contact**](#-contact)

---

## **Project Overview**

NamEdu.uz backend serves as the core service to manage user authentication, news, users. It provides a secure and scalable API to interact with the frontend.

---

## **Tech Stack**

- **Node.js** – Server-side runtime
- **Express.js** – Web framework
- **MongoDB** – Database
- **Mongoose** – ODM for MongoDB
- **Redis** – In-memory data store for caching and session management
- **TypeScript** – Static type checking

---

## **Prerequisites**

Before running the project, ensure you have the following installed:

- **Node.js** (>= v18)
- **Yarn** (or npm)
- **MongoDB** (local or cloud)
- **Redis**

---

## **Installation**

1. Clone the repository:

```bash
 git clone https://github.com/IJTechs/namedu-backend.git
 cd namedu-backend
```

2. Install dependencies:

```bash
 yarn install
```

---

## **Configuration**

1. Create a \`.env\` file in the project root and configure your environment variables:

   ```
   PORT=5000
   NODE_ENV=development

   MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/yourDB?retryWrites=true&w=majority

   REDIS_URL=redis://localhost:6379

   ACCESS_TOKEN_SECRET=
   REFRESH_TOKEN_SECRET=
   ACCESS_TOKEN_EXPIRE=
   REFRESH_TOKEN_EXPIRE=
   JWT_ISSUER=
   ```

---

## **Running the Project**

1. Start the server in development mode:

   ```bash
   yarn dev
   ```

2. Run the production build:

```bash
 yarn start
```

---

## **API Documentation**

- **Swagger UI:** Coming soon...
- **Postman Collection:** [Link to collection](#)

---

## 📝 **Contact**

- **Email**: [osimjonovisoqjon2004@gmail.com](mailto:osimjonovisoqjon2004@gmail.com)
- **GitHub**: [Isokjon-Osimjonov](https://github.com/Isokjon-Osimjonov)
- **Telegram**: [Isokjon](https://t.me/isokjon_io)
