from django.contrib import admin
from .models import Artista, Recinto, Concierto

# Registramos nuestros modelos para que aparezcan en el panel
admin.site.register(Artista)
admin.site.register(Recinto)
admin.site.register(Concierto)