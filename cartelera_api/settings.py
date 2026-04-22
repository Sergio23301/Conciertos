"""
Django settings for cartelera_api project.
Final Version - Incluye Jazzmin, CORS y Email Service.
Autor: Sergio Eduardo Dominguez Trejo
"""

from pathlib import Path

# Directorio base del proyecto
BASE_DIR = Path(__file__).resolve().parent.parent

# SEGURIDAD
SECRET_KEY = 'django-insecure-#=qtrfb73%d1$_syr=+zd1il=rv72ys$3j_qhdm0gs%=ksczm='
DEBUG = True
ALLOWED_HOSTS = ['*']  # MODIFICADO: Ahora permite conexiones de Docker y red local

# ==========================================================
# APLICACIONES INSTALADAS
# ==========================================================
INSTALLED_APPS = [
    'jazzmin',           # El diseño moderno debe ir primero
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    
    # Librerías externas y apps del proyecto
    'rest_framework', 
    'eventos',        
    'corsheaders',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'corsheaders.middleware.CorsMiddleware', # Middleware de CORS
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'cartelera_api.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'templates'], # MODIFICADO: Agregada ruta para encontrar index.html
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'cartelera_api.wsgi.application'

# BASE DE DATOS
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}

# VALIDACIÓN DE CONTRASEÑAS
AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

# ==========================================================
# INTERNACIONALIZACIÓN (Español México)
# ==========================================================
LANGUAGE_CODE = 'es-mx'
TIME_ZONE = 'America/Mexico_City'
USE_I18N = True
USE_TZ = True

# ARCHIVOS ESTÁTICOS
STATIC_URL = '/static/'
#STATIC_ROOT = BASE_DIR / 'staticfiles'  # AGREGADO: Carpeta de recolección
STATICFILES_DIRS = [BASE_DIR / 'static']  # AGREGADO: Dónde buscar archivos locales

# ==========================================================
# CONFIGURACIÓN CORS (Comunicación con Frontend 8081)
# ==========================================================
CORS_ALLOW_ALL_ORIGINS = True
CORS_ALLOW_CREDENTIALS = True

# ==========================================================
# CONFIGURACIÓN DE ENVÍO DE CORREOS (Ticket Service)
# ==========================================================
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = 'smtp.gmail.com'
EMAIL_PORT = 587
EMAIL_USE_TLS = True
# REEMPLAZA ESTOS DATOS CON TUS CREDENCIALES REALES:
EMAIL_HOST_USER = 'eduardoysuspadres@gmail.com' 
EMAIL_HOST_PASSWORD = 'tssf wuwi ccbz tmfo' 
DEFAULT_FROM_EMAIL = 'TicketLive <eduardoysuspadres@gmail.com>'

# ==========================================================
# CONFIGURACIÓN DE JAZZMIN (Interfaz Admin)
# ==========================================================
JAZZMIN_SETTINGS = {
    "site_title": "TicketLive Admin",
    "site_header": "TicketLive",
    "site_brand": "TicketLive Management",
    "welcome_sign": "Bienvenido al Panel de Control de TicketLive",
    "copyright": "Sergio Eduardo Dominguez Trejo",
    "search_model": ["eventos.Concierto"],
    "show_ui_builder": True,
    
    "icons": {
        "auth": "fas fa-users-cog",
        "auth.user": "fas fa-user",
        "auth.Group": "fas fa-users",
        "eventos.Artista": "fas fa-microphone",
        "eventos.Recinto": "fas fa-building",
        "eventos.Concierto": "fas fa-ticket-alt",
    },
}

JAZZMIN_UI_TWEAKS = {
    "theme": "flatly",
    "dark_mode_theme": "darkly",
}

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'
STATIC_ROOT = BASE_DIR / "staticfiles"