# Deploy Employee Management to Azure

## What you will deploy

| Component | Azure resource | Code / artifact |
| --- | --- | --- |
| React frontend | Static Web Apps | `frontend/dist` |
| Spring Boot API | App Service, Linux, Java 21, Java SE | `backend/employee-management/target/employee-management.jar` |
| Database | Azure Database for MySQL Flexible Server | `EmployeeDetails` database |

The browser calls the API directly over HTTPS. You do not need to link an API in
Static Web Apps. The backend permits browser requests from your frontend's exact
origin through its Spring CORS configuration.

Prerequisites: an Azure subscription, access to this GitHub repository's settings,
and Azure permissions to create resources, create a managed identity, and assign
its role on the web app. App Service and MySQL incur charges; review the portal's
cost estimate before creating them. Use one resource group and the same region
for the backend and database where possible.

This app currently has no login or authorization. Anyone who can reach the API
can read, create, edit, and delete records. Use sample data for a public demo.
Authentication must protect the backend itself before using real employee data;
restricting frontend access or configuring CORS alone is insufficient.

## 1. Create the database

1. In Azure Portal, create **Azure Database for MySQL Flexible Server**. Select
   MySQL 8.0, a region you can also use for App Service, and an appropriate compute
   tier (a small Burstable tier is suitable for a demo). Save the administrator
   username and password securely.
2. For this setup, select **Public access (allowed IP addresses)** and initially
   allow only your current client IP. Keep secure transport/TLS enabled. Do not
   allow the entire internet or the broad “all Azure services” rule.
3. Copy the full server hostname shown in Overview, such as
   `YOUR-SERVER.mysql.database.azure.com`.
4. Connect using MySQL Workbench or a MySQL client with TLS and run the following,
   replacing the sample password with your own strong, unique password:

   ```sql
   CREATE DATABASE IF NOT EXISTS EmployeeDetails CHARACTER SET utf8mb4;
   CREATE USER 'employee_app'@'%' IDENTIFIED BY 'REPLACE_WITH_A_STRONG_PASSWORD';
   GRANT SELECT, INSERT, UPDATE, DELETE, CREATE, ALTER, INDEX, REFERENCES
     ON EmployeeDetails.* TO 'employee_app'@'%';
   ```

   Use `employee_app` and its password for the application, not the administrator.
   New Azure databases start empty; these steps do not migrate local records.

The current application uses Hibernate `ddl-auto=update` to create/update tables
for this initial deployment. Before a real production rollout, introduce versioned
schema migrations, change `DB_DDL_AUTO` to `validate`, and remove schema-changing
permissions from the application user after applying migrations separately.

## 2. Create the backend App Service

1. Create a **Web App** in the resource group: Publish **Code**, operating system
   **Linux**, runtime **Java 21**, web server **Java SE** (not Tomcat or JBoss).
   Select a suitable App Service plan; Basic B1 is a starting point for a small
   demo that needs Always On and health checks. Leave continuous deployment off
   during creation; this repository already contains its workflow.
2. Copy the **Default domain** from Overview. Use the exact value shown, including
   any generated suffix, rather than constructing it from the app name.
3. Enable **HTTPS Only** and **Always On**. Leave the startup command empty: the
   built-in Java SE runtime starts the deployed JAR. No Docker settings are needed.
4. In App Service **Properties**, copy **all possible outbound IP addresses**.
   Add each IP as a separate allowed address under the MySQL server's Networking
   firewall rules. Revisit these rules when changing the App Service plan or region.
5. Keep App Service's platform CORS list empty; the application manages CORS.

## 3. Create the frontend Static Web App

1. Create **Static Web App** in the resource group. The Free plan is sufficient
   for this direct-to-backend demo. Choose deployment source **Other** so the
   portal does not generate a second GitHub workflow.
2. Copy the HTTPS frontend URL shown in Overview, for example
   `https://YOUR-SITE.azurestaticapps.net`.
3. Under **Manage deployment token**, copy the token into a password manager for
   the GitHub secret in step 6. Do not commit it to the repository.

## 4. Configure the backend environment

In App Service → **Settings → Environment variables → App settings**, add these
values and apply the changes (some portal views call this **Configuration**):

| Name | Value |
| --- | --- |
| `SPRING_PROFILES_ACTIVE` | `azure` |
| `DB_HOST` | Full MySQL hostname, e.g. `YOUR-SERVER.mysql.database.azure.com` |
| `DB_NAME` | `EmployeeDetails` (case-sensitive) |
| `DB_USERNAME` | `employee_app` |
| `DB_PASSWORD` | The application user's database password |
| `CORS_ALLOWED_ORIGINS` | Exact frontend HTTPS origin, without a trailing slash |

The Azure profile uses TLS with certificate and hostname verification
(`sslMode=VERIFY_IDENTITY`). Use the Azure MySQL hostname, not an IP address or
custom alias. Keep the Java runtime and its CA trust store current.

For multiple frontend origins, enter a comma-separated list, without paths or
wildcards. Do not add `localhost` unless you explicitly want local browser access
to the cloud database. Do not set `DB_URL` or `SPRING_DATASOURCE_URL` in Azure;
the profile constructs the TLS connection URL from `DB_HOST` and `DB_NAME`.

Configure App Service **Health check** to use `/actuator/health`. It returns HTTP
200 and `{"status":"UP"}` only when the app and database are healthy. Database
passwords belong in App Service settings (or Key Vault references), never in Git
or any frontend variable.

## 5. Allow GitHub to deploy the backend using OIDC

This uses short-lived identity tokens; no publish profile or client secret is
required, and SCM basic authentication can remain disabled.

1. In Azure Portal, create a **User Assigned Managed Identity**, for example
   `employee-management-github`, in your resource group.
2. Open the identity's **Federated credentials** and add a credential using the
   **GitHub Actions deploying Azure resources** scenario:
   - Organization: `JaykerAnthony`
   - Repository: `employee-management`
   - Entity type: **Branch**
   - Branch: `main`
   - Name: `github-main`
3. Verify the issuer is `https://token.actions.githubusercontent.com`, audience
   is `api://AzureADTokenExchange`, and subject is exactly
   `repo:JaykerAnthony/employee-management:ref:refs/heads/main`.
4. Open the **backend Web App → Access control (IAM) → Add role assignment**.
   Assign **Website Contributor** to that managed identity, scoped to this Web
   App. You need permission to assign roles; if this control is unavailable, your
   subscription administrator must perform this step.
5. Copy the managed identity's **Client ID** and **Tenant ID**, and your Azure
   **Subscription ID** for the repository variables below. Do not use its Object
   (Principal) ID as the Client ID. The identity need not be attached to the web
   app; GitHub uses it as the deployment identity.

## 6. Add GitHub variables and the deployment token

Open [repository Actions settings](https://github.com/JaykerAnthony/employee-management/settings/secrets/actions).
Under **Settings → Secrets and variables → Actions → Variables**, create these
**repository variables**:

| Variable | Value |
| --- | --- |
| `AZURE_CLIENT_ID` | Managed identity Client ID from step 5 |
| `AZURE_TENANT_ID` | Azure Tenant ID |
| `AZURE_SUBSCRIPTION_ID` | Azure Subscription ID |
| `AZURE_WEBAPP_NAME` | Backend Web App resource name, not its URL |
| `VITE_API_BASE_URL` | Backend's exact HTTPS origin, e.g. `https://YOUR-DEFAULT-DOMAIN` |

Under the **Secrets** tab, create:

| Secret | Value |
| --- | --- |
| `AZURE_STATIC_WEB_APPS_API_TOKEN` | Static Web App deployment token from step 3 |

Do not append `/api` or `/api/employees` to `VITE_API_BASE_URL`; the code appends
the endpoint. Vite embeds this public URL at build time, so changing it requires
another workflow run. Setting it only in Azure's frontend environment settings
does not change an already-built bundle.

## 7. Deploy and verify

1. Open [GitHub Actions](https://github.com/JaykerAnthony/employee-management/actions),
   select **Build and deploy to Azure**, then **Run workflow** using branch `main`.
2. The workflow lints/builds the frontend, tests/packages the backend, deploys the
   JAR, waits for its database health check, and then publishes the frontend. A
   failed build or health check prevents frontend deployment. Tests use H2, so
   they cannot verify your Azure MySQL firewall, password, or TLS trust in advance.
3. Open `https://YOUR-BACKEND-DOMAIN/actuator/health` and confirm `{"status":"UP"}`.
4. Open the Static Web App URL. Create a sample employee, refresh the page, edit
   it, and delete it. Confirm that each operation persists correctly.
5. Optionally add repository variable `AZURE_DEPLOY_ENABLED` with value `true`.
   Future pushes to `main` will then build and deploy automatically. Leave it
   unset or `false` for manual deployments only. Pull requests always build/test
   without deploying or requiring Azure credentials.

The initial code push runs CI only while deployment is disabled. This guide does
not create or bill Azure resources automatically. Do not use Deployment Center
to generate a competing workflow alongside this one.

## Troubleshooting

| Symptom | What to check |
| --- | --- |
| Deployment jobs skipped | Expected on a normal push unless `AZURE_DEPLOY_ENABLED=true`; run manually on `main` for the first deployment. |
| Missing deployment configuration | Variables belong in GitHub's **Variables** tab; only the SWA token belongs in **Secrets**. |
| OIDC login fails | Exact repository/branch subject, Client ID vs Object ID, tenant, and role assignment propagation. |
| Backend startup fails / health is DOWN | App Service **Log stream**; `SPRING_PROFILES_ACTIVE=azure`, DB credentials, database name, MySQL firewall and server availability. |
| Database certificate error | Correct `*.mysql.database.azure.com` hostname and current Java CA trust store; follow Azure's TLS certificate guidance below. Do not disable verification. |
| Frontend requests hit its own domain | Missing `VITE_API_BASE_URL` at build time; set the repository variable and rerun. |
| Browser reports CORS failure | `CORS_ALLOWED_ORIGINS` exactly matches the browser origin, with no trailing slash; save/restart backend and leave platform CORS empty. |
| Health check succeeds but browser fails | Inspect browser Network tab; confirm API URL, origin and HTTPS; the server-side health check does not test browser CORS. |
| Data is empty after deployment | Azure has a new database; local MySQL records are not copied by deploying code. |

## Official references

- [App Service GitHub Actions deployment](https://learn.microsoft.com/en-us/azure/app-service/deploy-github-actions)
- [Create managed identity federation for GitHub](https://learn.microsoft.com/en-us/entra/workload-id/workload-identity-federation-create-trust-user-assigned-managed-identity)
- [Static Web Apps build and prebuilt artifact configuration](https://learn.microsoft.com/en-us/azure/static-web-apps/build-configuration)
- [Azure MySQL TLS and certificate configuration](https://learn.microsoft.com/en-us/azure/mysql/flexible-server/security-tls-how-to-connect)
