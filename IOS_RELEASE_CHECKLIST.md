# Students Life — подготовка сборки, 15.10.2026

## Текущий релиз

Добавлены опросы (Новости → Опросы), последняя новость на главной, 12 офлайн-пакетов
документов и инструкция по заявке. Для iPhone используется Expo Push Token, Android
остаётся на FCM. Временные ошибки провайдера больше не отключают устройство навсегда.
При EAS iOS build настройте Apple Push Notifications Key. Не присылайте приватный ключ в чат.
Если в Expo включена enhanced push security, EXPO_ACCESS_TOKEN нужно установить только
на сервере клиента и ManagerSL; в мобильную конфигурацию его добавлять нельзя.

15.10 TypeScript, отдельные Expo iOS/Android exports с --max-workers 1 прошли.
36 серверных тестов прошли, `expo install --check` подтвердил совместимость зависимостей.
Опросы и Expo push transport установлены на backend, ManagerSL и exam reminder worker;
ManagerSL service API проверен чтением без публикации тестовых опросов.
Одновременный экспорт двух платформ на этом компьютере упёрся в память; повтор по одной
платформе прошёл. Expo ticket означает принятие сообщения сервисом, не доставку на iPhone.
Перед публикацией обязательна проверка TestFlight: вход, полная анкета, документы,
чат, голосование и push о готовности кабинета. Сборка в магазине не выполнялась агентом.

Рабочая копия: `C:\Users\ThinkPad\Desktop\projects\students-life-app\mobile`.
Перед сборкой не очищайте существующие незакоммиченные изменения: они содержат
обновления анкеты, статуса поступления и клиентского интерфейса.

## Проверено локально

- `npm run typecheck` — успешно.
- `npx expo export --platform ios` (1806 модулей) и `--platform android`
  (1815 модулей) — успешно.
- Expo config: `com.students.life`, версия `1.0.10`, EAS project
  `7787dd53-8b3a-404a-ab14-10ee7bc45df2`; клиентский API —
  `manager-sl.ru/client-app/api/v1`, каталог — `manager-sl.ru/api/client/v1`.
- `GoogleService-Info.plist`, иконка и splash присутствуют. Содержимое plist не
  коммитить и не пересылать в чат.
- Страница политики конфиденциальности для карточки App Store:
  `https://www.stud-life.com/privacy-policy/`. На сети с блокировкой SNI
  `stud-life.com` может не открываться; копия внутри приложения доступна по
  `https://manager-sl.ru/client-app/privacy-policy/`.
- 12 backend-тестов прошли в изолированной SQLite БД с замоканными интеграциями.
  Серверный маршрут проверен без клиентских данных: новости 200, GET активации
  405, статус без токена 401. Это не сквозная отправка реальной заявки.
- Публичная версия App Store для TM на момент проверки — 1.0.6. Наличие более
  новой ожидающей сборки в App Store Connect здесь не проверено.

## Команды из папки mobile

```powershell
npm run typecheck
npx expo export --platform ios
npx eas-cli login
npx eas-cli build --platform ios --profile production
npx eas-cli submit --platform ios --profile production --latest
```

Для Android AAB из той же папки: `npx eas-cli build --platform android --profile production`.

Сначала соберите и проверьте приложение через TestFlight. После загрузки IPA
откройте App Store Connect, заполните описание обновления, скриншоты iPhone и
iPad (в конфигурации `supportsTablet: true`), privacy-поля и отправьте сборку
на App Review. `eas submit` сам по себе не публикует приложение в App Store.

Перед публикацией на реальном iPhone проверьте вход, экспресс-заявку и Email,
полную анкету, офлайн-новости/каталог, чат и загрузку документов, статус
поступления, push. Клиентский backend и ManagerSL должны поддерживать
`activate-onboarding` и `admission-status`; экспорт JavaScript не проверяет
эти серверные сценарии. Из-за эпизодических TCP-таймаутов к `72.62.37.145`
обязательно проверить сеть Wi-Fi и мобильную сеть до публикации.

Не используйте `--auto-submit`, если хотите вручную выбрать проверенную сборку.
Если EAS попросит Apple Developer credentials, выполните интерактивные шаги
под своей Apple-учётной записью; никому не отправляйте пароль или API key.
