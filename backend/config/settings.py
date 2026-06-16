from pathlib import Path
from datetime import timedelta

from corsheaders.defaults import default_headers
from decouple import Csv, config
from django.core.exceptions import ImproperlyConfigured

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = config('SECRET_KEY', default='dev-secret-key')
DEBUG = config('DEBUG', default=True, cast=bool)
USE_SQLITE = config('USE_SQLITE', default=DEBUG, cast=bool)

ALLOWED_HOSTS = config(
    'ALLOWED_HOSTS',
    default='localhost,127.0.0.1,0.0.0.0,*',
    cast=Csv(),
)

if not DEBUG and SECRET_KEY in {'dev-secret-key', 'change-me'}:
    raise ImproperlyConfigured('Set a strong SECRET_KEY when DEBUG=False.')

if not DEBUG and '*' in ALLOWED_HOSTS:
    raise ImproperlyConfigured('ALLOWED_HOSTS must not contain "*" when DEBUG=False.')

INSTALLED_APPS = [
    'unfold',

    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',

    'rest_framework',
    'rest_framework_simplejwt',
    'rest_framework_simplejwt.token_blacklist',
    'django_filters',
    'drf_spectacular',
    'corsheaders',
    'channels',

    'apps.accounts',
    'apps.staff',
    'apps.services',
    'apps.locations',
    'apps.universities',
    'apps.applications',
    'apps.news',
    'apps.knowledge_base',
    'apps.chat',
    'apps.notifications',
    'apps.common',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'config.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'config.wsgi.application'
ASGI_APPLICATION = 'config.asgi.application'

if USE_SQLITE:
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': BASE_DIR / 'db.sqlite3',
        },
    }
else:
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.postgresql',
            'NAME': config('DB_NAME', default='students_life'),
            'USER': config('DB_USER', default='students_life_user'),
            'PASSWORD': config('DB_PASSWORD', default='students_life_password'),
            'HOST': config('DB_HOST', default='localhost'),
            'PORT': config('DB_PORT', default='5432'),
        },
    }

AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

LANGUAGE_CODE = config('LANGUAGE_CODE', default='ru')
TIME_ZONE = config('TIME_ZONE', default='Europe/Moscow')
USE_I18N = True
USE_TZ = True

STATIC_URL = config('STATIC_URL', default='/static/')
STATIC_ROOT = BASE_DIR / 'staticfiles'

MEDIA_URL = config('MEDIA_URL', default='/media/')
MEDIA_ROOT = BASE_DIR / 'media'

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

CORS_ALLOW_ALL_ORIGINS = DEBUG and config('CORS_ALLOW_ALL_ORIGINS', default=False, cast=bool)

CORS_ALLOWED_ORIGINS = config(
    'CORS_ALLOWED_ORIGINS',
    default='http://localhost:3000,http://localhost:8081,http://127.0.0.1:8081,http://127.0.0.1:3000',
    cast=Csv(),
)

CSRF_TRUSTED_ORIGINS = config(
    'CSRF_TRUSTED_ORIGINS',
    default='http://localhost:3000,http://localhost:8081,http://127.0.0.1:8081,http://127.0.0.1:3000',
    cast=Csv(),
)

CORS_ALLOW_HEADERS = list(default_headers) + [
    'x-device-platform',
    'idempotency-key',
]

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.AllowAny',
    ],
    'DEFAULT_FILTER_BACKENDS': [
        'django_filters.rest_framework.DjangoFilterBackend',
        'rest_framework.filters.SearchFilter',
        'rest_framework.filters.OrderingFilter',
    ],
    'DEFAULT_SCHEMA_CLASS': 'drf_spectacular.openapi.AutoSchema',
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20,
    'DEFAULT_THROTTLE_CLASSES': [
        'rest_framework.throttling.ScopedRateThrottle',
    ],
    'DEFAULT_THROTTLE_RATES': {
        'register': config('THROTTLE_REGISTER_RATE', default='5/hour'),
        'login': config('THROTTLE_LOGIN_RATE', default='10/min'),
        'applications_create': config('THROTTLE_APPLICATION_CREATE_RATE', default='5/hour'),
        'push_token': config('THROTTLE_PUSH_TOKEN_RATE', default='10/min'),
        'activity': config('THROTTLE_ACTIVITY_RATE', default='60/min'),
        'chat_message': config('THROTTLE_CHAT_MESSAGE_RATE', default='20/min'),
        'chat_upload': config('THROTTLE_CHAT_UPLOAD_RATE', default='10/min'),
    },
}

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=30),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=14),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    'AUTH_HEADER_TYPES': ('Bearer',),
}

SPECTACULAR_SETTINGS = {
    'TITLE': 'Student’s Life Mobile API',
    'DESCRIPTION': 'API для мобильного приложения Student’s Life',
    'VERSION': '1.0.0',
    'SERVE_INCLUDE_SCHEMA': False,
}

CHANNEL_LAYERS = {
    'default': {
        'BACKEND': 'channels_redis.core.RedisChannelLayer',
        'CONFIG': {
            'hosts': [config('REDIS_URL', default='redis://localhost:6379/0')],
        },
    },
}

CELERY_BROKER_URL = config('REDIS_URL', default='redis://localhost:6379/0')
CELERY_RESULT_BACKEND = config('REDIS_URL', default='redis://localhost:6379/0')

FIREBASE_CREDENTIALS_PATH = config('FIREBASE_CREDENTIALS_PATH', default='')

MANAGER_SL_API_BASE_URL = config('MANAGER_SL_API_BASE_URL', default='')
MANAGER_SL_LEADS_API_KEY = config('MANAGER_SL_LEADS_API_KEY', default='')
MANAGER_SL_TIMEOUT_SECONDS = config('MANAGER_SL_TIMEOUT_SECONDS', default=8, cast=int)

CHAT_IMAGE_MAX_UPLOAD_SIZE = config('CHAT_IMAGE_MAX_UPLOAD_SIZE', default=6 * 1024 * 1024, cast=int)
CHAT_IMAGE_MAX_STORED_SIZE = config('CHAT_IMAGE_MAX_STORED_SIZE', default=2 * 1024 * 1024, cast=int)
CHAT_IMAGE_MAX_DIMENSION = config('CHAT_IMAGE_MAX_DIMENSION', default=1600, cast=int)

APPLICATION_FILE_MAX_UPLOAD_SIZE = config('APPLICATION_FILE_MAX_UPLOAD_SIZE', default=10 * 1024 * 1024, cast=int)

CHAT_WEBSOCKET_ENABLED = config('CHAT_WEBSOCKET_ENABLED', default=False, cast=bool)
CHAT_WEBSOCKET_ALLOW_QUERY_TOKEN = config('CHAT_WEBSOCKET_ALLOW_QUERY_TOKEN', default=False, cast=bool)

SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')

SESSION_COOKIE_SECURE = not DEBUG
CSRF_COOKIE_SECURE = not DEBUG
SESSION_COOKIE_HTTPONLY = True
CSRF_COOKIE_HTTPONLY = False

SECURE_SSL_REDIRECT = config('SECURE_SSL_REDIRECT', default=False, cast=bool)
SECURE_CONTENT_TYPE_NOSNIFF = True
SECURE_REFERRER_POLICY = config('SECURE_REFERRER_POLICY', default='same-origin')
SECURE_HSTS_SECONDS = config('SECURE_HSTS_SECONDS', default=0 if DEBUG else 31536000, cast=int)
SECURE_HSTS_INCLUDE_SUBDOMAINS = config('SECURE_HSTS_INCLUDE_SUBDOMAINS', default=not DEBUG, cast=bool)
SECURE_HSTS_PRELOAD = config('SECURE_HSTS_PRELOAD', default=False, cast=bool)
X_FRAME_OPTIONS = 'DENY'

UNFOLD = {
    'SITE_TITLE': 'Student’s Life Admin',
    'SITE_HEADER': 'Student’s Life',
    'SITE_SUBHEADER': 'Панель управления приложением',
    'SITE_URL': 'https://students-life.ru/ru',
    'SITE_SYMBOL': 'school',
    'SHOW_HISTORY': True,
    'SHOW_VIEW_ON_SITE': True,
    'COLORS': {
        'primary': {
            '50': '254 242 242',
            '100': '254 226 226',
            '200': '254 202 202',
            '300': '252 165 165',
            '400': '248 113 113',
            '500': '229 57 53',
            '600': '220 38 38',
            '700': '185 28 28',
            '800': '153 27 27',
            '900': '127 29 29',
            '950': '69 10 10',
        },
        'secondary': {
            '50': '239 246 255',
            '100': '219 234 254',
            '200': '191 219 254',
            '300': '147 197 253',
            '400': '96 165 250',
            '500': '21 101 192',
            '600': '37 99 235',
            '700': '29 78 216',
            '800': '30 64 175',
            '900': '30 58 138',
            '950': '23 37 84',
        },
    },
    'SIDEBAR': {
        'show_search': True,
        'show_all_applications': True,
    },
}
