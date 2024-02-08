# Instalacion y configuracion

## Repositorio en GitHub
El proyecto se puede clonar desde el repositorio de GitHub. Los siguientes comandos
asumen que hay una consola cuyo directorio de trabajo es la carpeta raíz del proyecto.

## Entorno virtual
Se recomienda crear un entorno virtual de Python para que las librerías instaladas no
interfieran con otras instalaciones del sistema

### Windows
`python -m venv .env`
`.env\Scripts\activate`

## spaCy
spaCy es la biblioteca de Python utilizada para cargar el modelo clasificador de texto. Los
siguientes comandos se ejecutan en la consola, después de activar el entorno virtual.

`pip install -U pip setuptools wheel`
`pip install -U spacy`

Los siguientes módulos deben instalarse si se ejecutará el entrenamiento de modelos

`pip install -U 'spacy[transformers,lookups]'`
`python -m spacy download es_core_news_sm`

## Flask
El servidor funciona con la biblioteca Flask para Python. Para instalarlo es necesario
ejecutar los siguientes comandos en la misma terminal (con el entorno virtual activado).

`pip install -U Flask`

Después de este punto, el servidor está listo para ejecutarse.

## Ejecución del servidor
El servidor se inicializa con el siguiente comando

`python run.py`

Este código inicializa el servidor en modo de depuración. Es importante recordar que este
método no debe utilizarse en producción ya que el modo de depuración permite la
ejecución de código python y representa una brecha de seguridad.
