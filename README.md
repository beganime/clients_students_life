# Student's Life mobile app

Repository contains:

- `backend/` - Django/DRF mobile API and admin panel for app users.
- `mobile/` - Expo React Native client.
- `mobile_app_design.html` - prepared mobile UI reference.

## Sprint 1 mobile API

The backend acts as the separate mobile application server and keeps app-owned data in its own database: app users, roles, profiles, push tokens, activity, applications, chats, messages, attachments, settings, and privacy policy content.

### Environment

Copy `backend/.env.example` and set:

- `MANAGER_SL_API_BASE_URL` - base URL of manager-sl API, for example `http://localhost:8001/api`.
- `MANAGER_SL_LEADS_API_KEY` - API key sent only by backend to manager-sl `POST /api/leads/create/`.
- `MANAGER_SL_TIMEOUT_SECONDS` - manager-sl request timeout.
- `THROTTLE_*` values - scoped DRF rate limits for register, login, application creation, push token save, activity, and future chat actions.

No manager-sl keys are stored in the mobile app.

### Added/updated endpoints

- `POST /api/v1/accounts/register/` - register app user with default `user` role.
- `POST /api/v1/auth/login/` - throttled JWT login.
- `GET/PATCH /api/v1/accounts/me/` - profile with `role`, `is_manager`, and activity.
- `POST /api/v1/accounts/activity/` - update `is_online`, `last_seen`, `last_active_at`, device platform/version.
- `POST /api/v1/notifications/device-tokens/` - save or refresh push token with rate limit.
- `GET /privacy-policy/` - public privacy policy page.
- `GET /api/v1/common/privacy-policy/` - privacy policy JSON.
- `GET /api/v1/locations/countries|cities/` - proxies manager-sl `api/client/v1` when configured, otherwise falls back to local DB.
- `GET /api/v1/universities/` and `GET /api/v1/universities/programs/` - proxies manager-sl catalog when configured.
- `GET /api/v1/services/` - proxies manager-sl public services when configured.
- `POST /api/v1/applications/` - creates a local app application, uses `Idempotency-Key`, then syncs to manager-sl lead API and stores `manager_sl_application_id`/sync status.

If manager-sl is temporarily unavailable during application creation, the local application remains saved with `manager_sl_sync_status=failed` and a user-friendly mobile message can be shown.
