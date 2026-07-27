# Student's Life review API prompt for Manager SL

Используй это как системный промпт или техническую памятку для менеджерской админки Manager SL.

## Базовая архитектура

- Источник истины по документам клиентов и анкетам абитуриентов: **backend Student's Life**.
- Manager SL не хранит собственные статусы проверки как основную логику.
- Manager SL должен вызывать API Student's Life и отображать актуальный ответ API.

## Base URLs

- Основной proxy URL: `https://students-life.ru/api2/api/v1/`
- Оригинальный URL: `https://stud-life.com/api/v1/`

Во всех примерах ниже путь указан относительно `/api/v1/`.

## Аутентификация для сервисных запросов

Если запрос идёт не от реального пользователя Student's Life, а от Manager SL как сервиса:

- передавай header `X-API-KEY: <service_api_key>`
- вместе с approve/reject/status передавай в body:
  - `reviewed_by_name`
  - `reviewed_by_email`

Если запрос идёт от авторизованного пользователя Student's Life, backend сам заполнит `reviewed_by` из `request.user`.

## Документы клиентов

### Получить список документов пользователя

- `GET /documents/my-documents/`

### Загрузить документ пользователя

- `POST /documents/my-documents/{document_type_id}/upload/`
- `multipart/form-data`
- поле файла: `file`

### Одобрить документ

- `POST /documents/{document_id}/approve/`

Body для сервисного вызова:

```json
{
  "reviewed_by_name": "Фарида Ходжаева",
  "reviewed_by_email": "farida@manager-sl.ru"
}
```

### Отклонить документ

- `POST /documents/{document_id}/reject/`

```json
{
  "comment": "Нужен более читаемый скан паспорта.",
  "reviewed_by_name": "Фарида Ходжаева",
  "reviewed_by_email": "farida@manager-sl.ru"
}
```

### Изменить статус документа

- `PATCH /documents/{document_id}/status/`

```json
{
  "status": "approved",
  "comment": "",
  "reviewed_by_name": "Фарида Ходжаева",
  "reviewed_by_email": "farida@manager-sl.ru"
}
```

### Массовый/внешний review endpoint

- `POST /documents/external-review/`

Поддерживает поля:

- `document_id`
- `status`
- `comment`
- `reviewed_by_name`
- `reviewed_by_email`

## Что Manager SL должен брать из ответа по документу

Используй и показывай поля:

- `document_id`
- `title`
- `status`
- `admin_comment`
- `uploaded_at`
- `reviewed_at`
- `reviewed_by_id`
- `reviewed_by_name`
- `reviewed_by_email`
- `reviewed_by_display`

`reviewed_by_display` — готовое поле для интерфейса. Его можно сразу показывать как имя менеджера, который проверил документ.

## Анкеты абитуриентов

### Получить мою анкету

- `GET /questionnaire/my-application-form/`

### Сохранить черновик анкеты

- `PATCH /questionnaire/my-application-form/draft/`

### Отправить анкету на проверку

- `POST /questionnaire/my-application-form/submit/`

### Перегенерировать документ анкеты

- `POST /questionnaire/my-application-form/regenerate-document/`

### Скачать документ анкеты

- `GET /questionnaire/my-application-form/document/`

## Сервисные endpoints проверки анкеты

### Одобрить анкету

- `POST /questionnaire/application-forms/{questionnaire_id}/approve/`

### Отклонить анкету

- `POST /questionnaire/application-forms/{questionnaire_id}/reject/`

```json
{
  "comment": "Нужно заполнить паспортные данные полностью.",
  "reviewed_by_name": "Фарида Ходжаева",
  "reviewed_by_email": "farida@manager-sl.ru"
}
```

### Изменить статус анкеты

- `PATCH /questionnaire/application-forms/{questionnaire_id}/status/`

```json
{
  "status": "approved",
  "comment": "",
  "reviewed_by_name": "Фарида Ходжаева",
  "reviewed_by_email": "farida@manager-sl.ru"
}
```

### Перегенерировать документ анкеты сервисно

- `POST /questionnaire/application-forms/{questionnaire_id}/regenerate-document/`

## Что Manager SL должен брать из ответа по анкете

Показывай в интерфейсе:

- `id`
- `full_name`
- `status`
- `submitted_at`
- `updated_at`
- `reviewed_at`
- `reviewed_by_id`
- `reviewed_by_name`
- `reviewed_by_email`
- `reviewed_by_display`
- `review_comment`
- `generated_document_url`
- `document_file`
- `missing_required_fields`
- `missing_required_field_labels`

## Правильная логика в интерфейсе Manager SL

1. Не хранить локально статус как отдельный источник истины.
2. После approve/reject/status сразу делать refetch карточки документа или анкеты.
3. В карточке всегда показывать:
   - кто проверил;
   - когда проверил;
   - комментарий, если есть.
4. Для rejected всегда требовать `comment`.
5. Для отображения имени менеджера использовать `reviewed_by_display`.

## Что уже обновлено на стороне Student's Life

- Документы теперь отдают имя и email проверившего.
- Документы теперь отдают время проверки.
- Анкеты теперь тоже поддерживают:
  - кто проверил;
  - когда проверил;
  - комментарий менеджера;
  - approve / reject / status endpoints.

