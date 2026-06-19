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
- `CHAT_IMAGE_MAX_UPLOAD_SIZE`, `CHAT_IMAGE_MAX_STORED_SIZE`, `CHAT_IMAGE_MAX_DIMENSION` - server-side chat photo validation and compression limits.
- `APPLICATION_FILE_MAX_UPLOAD_SIZE` - maximum size for application document uploads.
- `CHAT_WEBSOCKET_ENABLED`, `CHAT_WEBSOCKET_ALLOW_QUERY_TOKEN` - optional WebSocket transport switches; polling is the default mobile chat transport.

No manager-sl keys are stored in the mobile app.

### Mobile catalog configuration

The Expo app reads public education catalog data directly from manager-sl client API:

- `EXPO_PUBLIC_MANAGER_SL_API_BASE_URL` - optional mobile catalog API base URL. Defaults to `https://manager-sl.ru/api/client/v1`.
- `EXPO_PUBLIC_API_BASE_URL` - mobile app backend API base URL. Defaults to `https://stud-life.com/api/v1`.

Catalog screens use React Query persistence for countries, cities, universities, programs, and detail pages. Users can clear the persisted catalog cache from the mobile settings screen.

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
- `GET/POST /api/v1/chat/` - client chat rooms; managers see client rooms according to app role.
- `GET /api/v1/chat/{id}/messages/` - chat history for polling/refetch.
- `POST /api/v1/chat/{id}/send_message/` - text or image message, with scoped rate limits and image validation/compression.

If manager-sl is temporarily unavailable during application creation, the local application remains saved with `manager_sl_sync_status=failed` and a user-friendly mobile message can be shown.

## Sprint 3 hardening

- Application document uploads are restricted to PDF/JPEG/PNG/WebP, size-limited, signature-checked, and saved with generated names.
- Chat WebSocket transport is disabled by default; polling/refetch is the supported mobile chat path.
- Production settings reject weak `SECRET_KEY` and wildcard `ALLOWED_HOSTS` when `DEBUG=False`.
- See `docs/mobile-production-checklist.md` for the release/security checklist and manual QA scenarios.
