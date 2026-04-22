from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views 

router = DefaultRouter()
router.register(r'artistas', views.ArtistaViewSet)
router.register(r'recintos', views.RecintoViewSet)
router.register(r'conciertos', views.ConciertoViewSet)

urlpatterns = [
    # 1. Microservicio de Auth
    path('auth/registro/', views.registro_usuario, name='registro'),
    path('auth/login/', views.login_usuario, name='login'),
    
    # 2. Microservicio de Notificaciones (¡ESTA FALTABA!)
    path('enviar-ticket/', views.enviar_ticket, name='enviar_ticket'),
    
    # 3. Microservicio de Cartelera
    path('', include(router.urls)),
]