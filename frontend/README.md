# Employee Management frontend

React/Vite application. Use Node.js 24 and run `npm ci`, then `npm run dev`.

Local requests use Vite's `/api` proxy to the backend on port 8080. For an Azure
build, set `VITE_API_BASE_URL` to the backend HTTPS origin before `npm run build`.
This value is public and embedded in the bundle; never put credentials in a
`VITE_*` variable. See `.env.example` and the
[Azure deployment guide](../docs/AZURE_DEPLOYMENT.md).
