# Student's Life mobile production checklist

## Required environment

- Set `DEBUG=False` in production.
- Set a strong `SECRET_KEY`; `dev-secret-key` and `change-me` are rejected when `DEBUG=False`.
- Set exact `ALLOWED_HOSTS`; wildcard hosts are rejected when `DEBUG=False`.
- Set exact `CORS_ALLOWED_ORIGINS` and `CSRF_TRUSTED_ORIGINS`.
- Keep `MANAGER_SL_LEADS_API_KEY`, Firebase credentials, database credentials, and JWT secrets out of Git.
- Keep `CHAT_WEBSOCKET_ENABLED=False` unless WebSocket transport is deployed behind trusted TLS and proxy log redaction.

## Security checks

- Registration, login, application creation, push token save, activity, chat text, and chat upload use scoped DRF throttles.
- User role is server-controlled; public registration always creates `user`.
- Client users only see their own profile, applications, chats, messages, and files.
- Managers see app applications and client chats through `is_manager_user`.
- Chat uploads accept only JPEG, PNG, and WebP, then server-compress images.
- Application file uploads accept only PDF, JPEG, PNG, and WebP with size and signature validation.
- Uploaded application files and chat images are stored under generated UUID names.
- Push tokens are not logged by backend code; mobile push registration errors are swallowed.

## Final QA scenarios

- Register a new user and confirm `role=user`.
- Login, open profile, and confirm activity changes to online.
- Browse services, countries, cities, universities, and programs from manager-sl API.
- Create an application with an `Idempotency-Key`; repeat the same request and confirm no duplicate.
- Create a chat, send text, send an image, refresh messages, and mark messages read.
- Login as manager, view client applications, open client chat, reply, and check client receives a notification record.
- Try disallowed uploads such as `.exe`, renamed non-image files, oversized images, and invalid PDFs.
- Run backend migrations/checks in a working Python environment before deploy.
