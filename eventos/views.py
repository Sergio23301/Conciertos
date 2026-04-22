from rest_framework import viewsets
from .models import Artista, Recinto, Concierto
from .serializers import ArtistaSerializer, RecintoSerializer, ConciertoSerializer

# --- IMPORTS PARA AUTH, CORREO Y TICKETS ---
from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from django.utils.html import strip_tags
from django.conf import settings
# CAMBIA ESTO:
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.response import Response
import json

# ==========================================
# 1. MICROSERVICIO DE CARTELERA
# ==========================================
class ArtistaViewSet(viewsets.ModelViewSet):
    queryset = Artista.objects.all()
    serializer_class = ArtistaSerializer

class RecintoViewSet(viewsets.ModelViewSet):
    queryset = Recinto.objects.all()
    serializer_class = RecintoSerializer

class ConciertoViewSet(viewsets.ModelViewSet):
    queryset = Concierto.objects.all()
    serializer_class = ConciertoSerializer

# ==========================================
# 2. MICROSERVICIO DE AUTH
# ==========================================
@csrf_exempt
def registro_usuario(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            user = User.objects.create_user(
                username=data['username'],
                email=data.get('email', ''),
                password=data['password'],
                first_name=data.get('first_name', '')
            )
            return JsonResponse({"mensaje": "Usuario creado", "id": user.id}, status=201)
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=400)

@csrf_exempt
def login_usuario(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            user = authenticate(username=data.get('username'), password=data.get('password'))
            if user:
                # RETORNAMOS EMAIL Y NOMBRE PARA EL TICKET
                return JsonResponse({
                    "mensaje": "¡Bienvenido!", 
                    "user": user.username,
                    "nombre": user.first_name,
                    "email": user.email,
                    "rol": "Admin" if user.is_staff else "Usuario"
                }, status=200)
            return JsonResponse({"error": "Usuario o contraseña incorrectos"}, status=401)
        except:
            return JsonResponse({"error": "Error en el formato de datos"}, status=400)
    return JsonResponse({"error": "Método no permitido"}, status=405)

# ==========================================
# 3. SERVICIO DE ENVÍO DE TICKETS (DINÁMICO)
# ==========================================
# ==========================================
# 3. SERVICIO DE ENVÍO DE TICKETS (CORREGIDO)
# ==========================================
@csrf_exempt  # <--- AGREGA ESTA LÍNEA AQUÍ
@api_view(['POST'])
@authentication_classes([]) # <--- Agrega esto
@permission_classes([])
def enviar_ticket(request):
    try:
        datos = request.data
        
        # --- 1. LÓGICA DE CANTIDAD Y PRECIO ---
        cantidad = int(datos.get('cantidad', 1)) 
        
        # Límite de seguridad estilo Ticketmaster
        if cantidad > 8:
            cantidad = 8
            
        precio_unitario = float(datos.get('precio', 0))
        precio_total = precio_unitario * cantidad

        # --- 2. BÚSQUEDA DEL USUARIO EN DB ---
        nombre_en_ticket = datos.get('nombre')
        usuario_encontrado = User.objects.filter(first_name=nombre_en_ticket).first()
        
        # Determinamos a quién le llega el correo
        destinatario = usuario_encontrado.email if usuario_encontrado else datos.get('email')
        
        if not destinatario or destinatario == "sergio@ejemplo.com":
            destinatario = "eduardoysuspadres@gmail.com"

        print(f"DEBUG: Enviando compra de {cantidad} boletos a: {destinatario}")

        # --- 3. CONTEXTO PARA EL HTML ---
        # --- 3. CONTEXTO PARA EL HTML ---
        context = {
            'nombre': nombre_en_ticket,
            'artista': datos.get('artista'),
            'lugar': datos.get('lugar'),
            'fecha': datos.get('fecha'),
            'asiento': f"{cantidad} Boletos (Zona General)",
            'cantidad': cantidad,
            # Enviamos el dato con 3 nombres diferentes por si el HTML usa cualquiera de estos:
            'precio_total': precio_total, 
            'total': precio_total,
            'precio': precio_total,
            'autor': "Sergio Eduardo Dominguez Trejo"
        }

        # --- 4. GENERACIÓN Y ENVÍO DE CORREO ---
        html_content = render_to_string('emails/ticket_email.html', context)
        text_content = strip_tags(html_content)

        email = EmailMultiAlternatives(
            subject=f"🎟️ {cantidad} Entradas para {datos.get('artista')} - TicketLive",
            body=text_content,
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=[destinatario],
        )
        email.attach_alternative(html_content, "text/html")
        email.send()

        return Response({
            "estado": "OK", 
            "mensaje": f"Se enviaron {cantidad} boletos a {destinatario}",
            "total": precio_total
        }, status=200)

    except Exception as e:
        print(f"ERROR: {str(e)}")
        return Response({"estado": "ERROR", "mensaje": str(e)}, status=500)