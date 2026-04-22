from django.db import models

class Artista(models.Model):
    nombre = models.CharField(max_length=100)
    genero = models.CharField(max_length=50)

    def __str__(self):
        return self.nombre

class Recinto(models.Model):
    nombre = models.CharField(max_length=100)
    ciudad = models.CharField(max_length=100)
    capacidad_total = models.IntegerField()

    def __str__(self):
        return self.nombre

class Concierto(models.Model):
    artista = models.ForeignKey(Artista, on_delete=models.CASCADE)
    recinto = models.ForeignKey(Recinto, on_delete=models.CASCADE)
    fecha = models.DateTimeField()
    descripcion = models.TextField()

    def __str__(self):
        return f"{self.artista.nombre} en {self.recinto.nombre}"