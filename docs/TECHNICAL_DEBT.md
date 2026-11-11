# TECHNICAL_DEBT — social-network-api

| ID | Priority | Area | Item | Notes |
|----|----------|------|------|------|
| TD-1 | P1 | Dependency inventory | `projects/info/deps/social-network-api.md` is placeholder | Replace with real inventory before relying on upgrade specifics (Phase 4/6 prep). |
| TD-2 | P1 | Framework/runtime deps | Express 4.x, Mongoose 7.x, jsonwebtoken/bcryptjs/gravatar/express-validator/config/dotenv likely have major/minor updates | Assess & upgrade in Docker with tests (Phase 6). |
| TD-3 | P1 | Base images/CI | Node 22-alpine base digest freshness to verify; `actions/checkout` pinned to v4.2.2 (upgrade to v7.x SHA) | Phase 5/6/10. |
| TD-4 | P2 | Product/API completeness | `/api/posts` is stub on master (no Post model) vs course branches | Not changed unless explicitly in scope; document as known state. |
| TD-5 | P2 | Hygiene | `command.txt` scratch notes committed | Remove/relocate if not needed (Phase 4/7). |
| TD-6 | P2 | Audit coverage | Confirm `npm audit` runs against full lockfile context in CI as intended | Validate in container (Phase 6/10). |
| TD-7 | P3 | Docs | README encoding/display quirks to verify; keep aligned post-upgrade | Phase 15. |
