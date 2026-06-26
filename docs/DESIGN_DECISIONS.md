# Design Decisions

## Agreement terms: narrative-only (Approach A)

**Status:** Accepted  
**Date:** 2025-06-25

### Context

The original equity-swap game enforced numeric budgets: each founder had `totalEquityAvailable` and `equitySwapped`, and agreements validated that proposed equity percentages did not exceed remaining capacity.

The DWeb Nomad Infrastructure deck ([polycentricXdweb.md](../polycentricXdweb.md)) describes **rivalrous resources** qualitatively (e.g. "Deployable capital", "Maintainer hours") without numeric capacities.

Three approaches were considered:

| Approach | Description |
|----------|-------------|
| **A. Narrative-only** | Agreements are free-text terms; no automated budget enforcement |
| **B. Numeric budgets per template** | Each role template gets fixed numeric capacities at design time |
| **C. Player-declared capacity** | Players declare capacities at signup |

### Decision

**Approach A — narrative-only agreements.**

### Implications

- **Agreement versions** store narrative commitments only:
  - `partyACommitment` — what Party A offers (text)
  - `partyBCommitment` — what Party B offers (text)
  - `notes` — shared rationale, risks, and context (required)
- **No equity fields** on roles or agreements (`totalEquityAvailable`, `equitySwapped`, `equityFromCompanyA/B` are removed).
- **No resource budget validation** at agreement create/revise/approve time.
- **Approval flow unchanged** — bilateral propose → revise → sign → approve → complete.
- **VC / EIP-712 signing** (if used) signs the canonical terms hash of the narrative content, not equity percentages.
- **Future option:** numeric budgets (Approach B or C) can be added without changing the agreement workflow if playtesting shows a need.

### Role model (companion decision)

Players select one of **31 preset role templates** from the deck. Role template data lives in `role_templates` (DB seed) and `data/role-templates.json` (app source). Player instances are stored in `roles`.

See [DATABASE_SETUP.md](../DATABASE_SETUP.md) for schema setup.
