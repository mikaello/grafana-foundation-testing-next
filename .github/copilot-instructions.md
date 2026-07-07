# Copilot instructions

- Use the Grafana Foundation SDK to build dashboards; prefer the v1beta1 schema for grafanactl resources.
- Emit dashboards as Kubernetes-style manifests with `apiVersion: dashboard.grafana.app/v1beta1` and `kind: Dashboard`
- Keep generated JSON in `resources/` and source code in `index.ts`.
- Avoid reformatting unrelated files.
- After making changes, run the following commands to maintain code quality and ensure everything is working correctly:
  - Run `npm run format` to ensure consistent code style.
  - Run `npm run lint` to automatically fix linting issues.
  - Run `npm run assist` to get code suggestions and fixes.
  - Run `npm run build` to get Grafana resources.
  - Run `npm run validate` to check for schema compliance and catch errors early.
