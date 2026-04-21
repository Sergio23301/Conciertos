# Usar la versión exacta de Python que tienes en tu máquina
FROM python:3.12-slim

# Crear una carpeta de trabajo dentro del contenedor
WORKDIR /app

# Copiar el archivo de dependencias primero (para optimizar caché)
COPY requirements.txt .

# Instalar las librerías
RUN pip install --no-cache-dir -r requirements.txt

# Copiar el resto del código de tu proyecto
COPY . .

# Exponer el puerto 8000 (el que usa Django)
EXPOSE 8000

# Comando para iniciar el servidor
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]
