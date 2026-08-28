# cost: cyprus-dating

<!-- Generated from cost.json by the design-and-build runner. Edit the JSON and re-render; do not hand-edit this file. -->

## currency

EUR


## environments

- **env:** dev; **monthlyEstimate:** 45; **notes:** Planning figure, not a quote. Azure West Europe. Static Web App Free, Container Apps Consumption with scale-to-zero, Postgres flexible Burstable B1ms 32 GB no HA, Key Vault Standard, Log Analytics about 1 GB ingest.
- **env:** test; **monthlyEstimate:** 65; **notes:** Planning figure. Azure West Europe. Static Web App Free, Container Apps Consumption 0.25 vCPU 0.5 GiB min 1, Postgres flexible Burstable B1ms 32 GB no HA, Key Vault Standard, Log Analytics about 2 GB ingest.
- **env:** staging; **monthlyEstimate:** 110; **notes:** Planning figure. Azure West Europe. Static Web App Standard, Container Apps Consumption 0.5 vCPU 1 GiB min 1, Postgres flexible Burstable B2s 32 GB no HA, Key Vault Standard, Log Analytics about 3 GB ingest. Used to rehearse revision rollback.
- **env:** uat; **monthlyEstimate:** 125; **notes:** Planning figure. Azure West Europe. Same SKUs as staging, slightly higher Log Analytics ingest for deletion, export, and Photo verification dry-runs.
- **env:** prod; **monthlyEstimate:** 240; **notes:** Planning figure, not a quote. Azure West Europe. Static Web App Standard, Container Apps Consumption 0.5 vCPU 1 GiB min 1 max 3, Postgres flexible General Purpose 2 vCore 64 GB no HA with automated backups, Key Vault Standard, Log Analytics about 10 GB ingest. Sized for NFR-7: 10,000 registered Residents and 1,000 weekly active. Excludes photo blob storage, ACR, and Photo verification vendor fees.


## scalingCeilings

- NFR-7 caps v1 at 10,000 registered Residents and 1,000 weekly active, not millions.
- Container Apps ceiling: 3 replicas at 0.5 vCPU 1 GiB, about EUR 110 per month compute if all always-on.
- Postgres ceiling before a SKU change: General Purpose 4 vCore (D4ads_v5 class), about EUR 220 per month compute plus storage.
- Whole-stack ceiling at those SKUs: about EUR 450 per month. Alert and revisit SKUs if weekly active approaches 5,000.


## budget


- **env:** prod
- **threshold:** 350

