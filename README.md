# Canvas Pendientes

Extensión local de GNOME Shell que muestra las tareas no entregadas de Canvas LMS en la barra superior.

## Configuración

El programa auxiliar requiere estas variables:

```bash
export CANVAS_HOST='canvas.ejemplo.edu'
export CANVAS_TOKEN='tu-token-personal'
```

Como alternativa, puede leer archivos locales fuera del repositorio:

```text
~/.config/canvas-widget/host
~/.config/canvas-widget/token
```

También se puede cambiar esa ruta mediante `CANVAS_CONFIG_DIR`. Nunca publiques el token ni un archivo `.env` con credenciales.
