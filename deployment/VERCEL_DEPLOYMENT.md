# Vercel deployment

This repository is a monorepo. The Vercel projects and their configured root
directories are:

| App | Vercel project | Root directory |
| --- | --- | --- |
| Customer | `tasaheel-customer` | `web-customer` |
| Workshop | `tasaheel-workshop` | `web-workshop` |
| Admin | `tasaheel-admin` | `web-admin` |

Always deploy from the repository root through the deployment script. Do not
run `vercel` from an individual app directory because Vercel will append the
project's configured root directory a second time.

Preview one app:

```powershell
.\deployment\deploy-vercel.ps1 -App customer
```

Production deploy all three apps:

```powershell
.\deployment\deploy-vercel.ps1 -App all -Production
```

The script selects each project by its explicit Vercel project ID, so it does
not depend on a mutable root `.vercel/project.json` link.
