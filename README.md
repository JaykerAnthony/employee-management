# Employee Management System

React/Vite frontend, Java 21 Spring Boot REST API, and MySQL database.

## Run locally

Create a MySQL database named `EmployeeDetails`. Start the backend (set
`DB_USERNAME` and `DB_PASSWORD` in your shell if needed):

```bash
cd backend/employee-management
./mvnw spring-boot:run
```

In another terminal, start the frontend with Node.js 24:

```bash
cd frontend
npm ci
npm run dev
```

Open `http://localhost:5173`. Vite proxies `/api` to `http://localhost:8080`.
The backend reads environment variables from the shell; it does not automatically
load `.env` files. Vite reads frontend `.env` files.

## Deploy to Azure

Follow [the Azure deployment guide](docs/AZURE_DEPLOYMENT.md) to create:

- Azure Static Web Apps for the frontend.
- Azure App Service (Linux, Java 21, Java SE) for the backend.
- Azure Database for MySQL Flexible Server for persistent storage.

The [GitHub Actions workflow](.github/workflows/azure.yml) builds and tests on
pushes and pull requests. Deployment stays disabled until Azure is configured.
Run it manually on `main` for your first deployment, then optionally set
`AZURE_DEPLOY_ENABLED=true` to deploy future pushes automatically.

The API currently has **no authentication or authorization**. Use sample data for
a public demo. Add authentication and access control before storing real employee
data; CORS does not protect an API from direct requests.

## Verify

```bash
cd frontend
npm ci
npm run lint
npm run build
```

```bash
cd backend/employee-management
./mvnw -B -ntp clean verify
```

Backend tests use an isolated in-memory H2 database. They verify service behavior,
application startup, CRUD, CORS, and `/actuator/health`; they do not require or
modify your local MySQL data. Azure MySQL connectivity must be checked after
deployment.
