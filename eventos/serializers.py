from rest_framework import serializers
from .models import Artista, Recinto, Concierto

class ArtistaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Artista
        fields = '__all__'

class RecintoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Recinto
        fields = '__all__'

class ConciertoSerializer(serializers.ModelSerializer):
    # Esto es para que al pedir un concierto, nos traiga la info completa del artista y recinto
    artista = ArtistaSerializer(read_only=True)
    recinto = RecintoSerializer(read_only=True)

    class Meta:
        model = Concierto
        fields = '__all__'