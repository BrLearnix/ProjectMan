# ProjectMan

Gestor de proyectos para Visual Studio Code. ProjectMan te permite guardar, crear y abrir tus proyectos con un solo clic, sin depender de la carpeta de workspaces del editor.

![ProjectMan](media/projectman-icon.png)

## Características

- **Panel visual de proyectos**: una vista en la barra de actividad con iconos para cada uno de tus proyectos.
- **Añadir proyectos**: agrega cualquier carpeta de tu equipo a ProjectMan y accede a ella con un clic.
- **Crear proyecto en blanco**: crea una carpeta nueva con `README.md`, `.gitignore` e inicializa `git`.
- **Crear proyecto con comando**: se abre un terminal en la ubicación elegida para ejecutar comandos como `npm create vite@latest mi-proyecto`. Al terminar, la carpeta creada se añade automáticamente a la lista.
- **Abrir al instante**: abre el proyecto en VS Code (con terminal preparada en la raíz del proyecto).
- **Eliminar proyectos**: quita proyectos de la lista cuando ya no los necesites.
- **Barra de estado**: muestra cuántos proyectos tienes guardados y da acceso rápido a la lista.

## Requisitos

- Visual Studio Code 1.125.0 o superior.
- Para crear proyectos con comando, necesitas tener instaladas las herramientas correspondientes (Node.js, .NET CLI, etc.).

## Uso

1. Abre la vista **ProjectMan** en la barra de actividad.
2. Usa los botones de la parte superior de la vista para:
   - **Crear nuevo proyecto**: elige entre proyecto en blanco o proyecto con comando.
   - **Añadir proyecto**: selecciona una carpeta existente.
   - **Actualizar**: refresca la lista de proyectos.
3. Haz clic en un proyecto para abrirlo, y usa los botones sobre cada icono para abrirlo o eliminarlo.

También puedes usar la paleta de comandos (`Ctrl+Shift+P`) con los comandos `ProjectMan: ...`.

## Comandos

| Comando | Descripción |
| --- | --- |
| `ProjectMan: Crear nuevo proyecto` | Crea un proyecto en blanco o con comando |
| `ProjectMan: Crear proyecto con comando` | Abre un terminal para crear un proyecto ejecutando un comando |
| `ProjectMan: Añadir proyecto` | Agrega una carpeta existente |
| `ProjectMan: Abrir proyecto` | Abre un proyecto guardado |
| `ProjectMan: Eliminar proyecto` | Quita un proyecto de la lista |
| `ProjectMan: Mostrar proyectos` | Muestra la lista de proyectos |
| `ProjectMan: Actualizar` | Refresca la lista de proyectos |

## Licencia

Este proyecto se distribuye bajo la licencia MIT. Consulta el archivo [LICENSE](LICENSE).
