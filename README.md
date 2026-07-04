# Zensical Site

Sitio estático pensado para GitHub Pages y construido con Zensical.

## Local

Si quieres probarlo sin contenedor:

1. Instala Poetry con Python 3.12 disponible en el sistema.
2. Instala dependencias con `poetry install --no-root`.
3. Lanza `poetry run zensical serve` y abre `http://127.0.0.1:8000`.

Comandos de referencia:

```bash
pip install poetry
poetry install --no-root
poetry run zensical serve
```

Si prefieres instalar en el entorno actual sin crear un virtualenv gestionado por Poetry:

```bash
poetry config virtualenvs.create false
poetry install --no-root
```

## Devcontainer

El repositorio incluye una configuración de devcontainer para VS Code. Al abrir la carpeta en contenedor se instalan las dependencias del proyecto.

Flujo recomendado dentro del contenedor:

```bash
poetry run zensical serve --dev-addr 0.0.0.0:8000
```

El puerto 8000 queda publicado para previsualizar la página desde VS Code.

## Despliegue

El workflow de GitHub Actions instala Poetry, compila el sitio con Zensical y publica el resultado en GitHub Pages.
