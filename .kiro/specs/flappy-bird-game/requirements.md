# Requirements Document

## Introduction

Videojuego de navegación lateral inspirado en Flappy Bird, implementado como aplicación web usando HTML5 Canvas y JavaScript. El jugador controla un pájaro que debe volar entre pares de tuberías que se desplazan horizontalmente, ganando puntos por cada par superado. El juego termina cuando el pájaro colisiona con una tubería, con el suelo o con el techo. El objetivo es obtener la puntuación más alta posible.

## Glossary

- **Game**: El sistema principal del videojuego que gestiona el ciclo de juego completo.
- **Bird**: El personaje controlado por el jugador que se desplaza verticalmente mediante la acción de salto.
- **Pipe**: Obstáculo vertical compuesto por un par de tuberías (superior e inferior) con un hueco entre ellas por el que debe pasar el Bird.
- **Gap**: El espacio libre entre la tubería superior e inferior de un par de Pipes por el que puede pasar el Bird.
- **Score**: Contador numérico que incrementa cada vez que el Bird supera un par de Pipes.
- **High_Score**: La puntuación máxima registrada en la sesión actual del navegador.
- **Canvas**: El elemento HTML5 sobre el que se renderiza el juego.
- **Game_Loop**: El ciclo de actualización y renderizado que se ejecuta a intervalos regulares.
- **Gravity**: La fuerza constante que acelera al Bird hacia abajo.
- **Velocity**: La velocidad vertical instantánea del Bird en cada frame.
- **Collision**: El contacto del Bird con un Pipe, el suelo o el techo del Canvas.
- **Renderer**: El componente responsable de dibujar todos los elementos visuales en el Canvas.
- **Physics_Engine**: El componente responsable de calcular la posición y velocidad del Bird aplicando Gravity.
- **Input_Handler**: El componente que detecta y procesa las acciones del jugador (teclado, ratón, pantalla táctil).
- **Pipe_Manager**: El componente responsable de generar, mover y eliminar Pipes.
- **Score_Manager**: El componente responsable de calcular y persistir el Score y el High_Score.
- **State_Machine**: El componente que gestiona los estados del juego (idle, playing, game_over).

---

## Requirements

### Requirement 1: Ciclo de Juego Principal

**User Story:** Como jugador, quiero que el juego tenga un ciclo de inicio, partida y fin claramente definido, para que pueda entender en qué estado se encuentra el juego en todo momento.

#### Acceptance Criteria

1. THE Game SHALL mantener exactamente uno de los siguientes estados en todo momento: `idle`, `playing` o `game_over`.
2. WHEN el juego se carga en el navegador, THE Game SHALL mostrar la pantalla de inicio (`idle`) con instrucciones para comenzar.
3. WHEN el jugador realiza la acción de salto estando en estado `idle`, THE Game SHALL transicionar al estado `playing` e iniciar el Game_Loop.
4. WHEN se produce una Collision, THE Game SHALL transicionar al estado `game_over` y detener el Game_Loop.
5. WHEN el jugador realiza la acción de reinicio estando en estado `game_over`, THE Game SHALL reiniciar todos los componentes y transicionar al estado `idle`.
6. THE State_Machine SHALL garantizar que las transiciones entre estados solo ocurran en el orden definido: `idle` → `playing` → `game_over` → `idle`.

---

### Requirement 2: Física del Pájaro

**User Story:** Como jugador, quiero que el pájaro responda a mis acciones con una física fluida y predecible, para que el juego sea controlable y satisfactorio.

#### Acceptance Criteria

1. WHILE el estado del Game es `playing`, THE Physics_Engine SHALL aplicar una Gravity constante de 0.5 píxeles por frame al cuadrado sobre la Velocity vertical del Bird en cada frame del Game_Loop.
2. WHEN el jugador realiza la acción de salto estando en estado `playing`, THE Physics_Engine SHALL asignar una Velocity vertical de -8 píxeles por frame al Bird (dirección ascendente).
3. THE Physics_Engine SHALL actualizar la posición vertical del Bird sumando la Velocity actual a la posición Y del Bird en cada frame.
4. THE Physics_Engine SHALL limitar la Velocity vertical máxima descendente del Bird a 12 píxeles por frame para evitar caídas instantáneas.
5. WHEN la posición Y del Bird supera el límite inferior del Canvas (suelo), THE Game SHALL registrar una Collision.
6. WHEN la posición Y del Bird es menor que 0 (techo del Canvas), THE Game SHALL registrar una Collision.

---

### Requirement 3: Generación y Movimiento de Tuberías

**User Story:** Como jugador, quiero que las tuberías aparezcan de forma continua y con variación, para que el juego sea desafiante y no repetitivo.

#### Acceptance Criteria

1. WHILE el estado del Game es `playing`, THE Pipe_Manager SHALL generar un nuevo par de Pipes cada 1500 milisegundos.
2. THE Pipe_Manager SHALL posicionar cada nuevo par de Pipes en el borde derecho del Canvas (fuera del área visible).
3. THE Pipe_Manager SHALL calcular la posición vertical del Gap de cada par de Pipes de forma aleatoria, garantizando que el Gap tenga una altura fija de 150 píxeles y que ambas tuberías (superior e inferior) tengan una altura mínima de 50 píxeles.
4. WHILE el estado del Game es `playing`, THE Pipe_Manager SHALL desplazar todos los Pipes activos hacia la izquierda a una velocidad constante de 3 píxeles por frame.
5. WHEN un par de Pipes sale completamente del borde izquierdo del Canvas, THE Pipe_Manager SHALL eliminar ese par de Pipes de la lista de Pipes activos.
6. THE Pipe_Manager SHALL mantener en memoria únicamente los Pipes activos (visibles o próximos a aparecer) para optimizar el rendimiento.

---

### Requirement 4: Detección de Colisiones

**User Story:** Como jugador, quiero que las colisiones se detecten con precisión, para que el juego sea justo y las muertes no parezcan injustas.

#### Acceptance Criteria

1. WHILE el estado del Game es `playing`, THE Game SHALL evaluar colisiones entre el Bird y cada Pipe activo en cada frame del Game_Loop.
2. THE Game SHALL utilizar detección de colisiones basada en rectángulos (AABB — Axis-Aligned Bounding Box) para determinar si el Bird intersecta con cualquier Pipe.
3. THE Game SHALL aplicar un margen de tolerancia (hitbox reducida) de 4 píxeles en cada lado del Bird para que las colisiones percibidas sean visualmente justas.
4. WHEN el rectángulo de colisión del Bird intersecta con el rectángulo de cualquier Pipe activo, THE Game SHALL registrar una Collision.
5. WHEN se registra una Collision, THE Game SHALL transicionar inmediatamente al estado `game_over` sin procesar más frames de física.

---

### Requirement 5: Sistema de Puntuación

**User Story:** Como jugador, quiero ver mi puntuación en tiempo real y conocer mi récord personal, para que tenga motivación para mejorar.

#### Acceptance Criteria

1. THE Score_Manager SHALL inicializar el Score a 0 al comienzo de cada partida.
2. WHEN el Bird supera completamente el borde derecho de un par de Pipes (el Bird ha cruzado el eje X del centro del Pipe), THE Score_Manager SHALL incrementar el Score en 1 punto.
3. THE Renderer SHALL mostrar el Score actual en la esquina superior central del Canvas durante el estado `playing`.
4. WHEN el Game transiciona al estado `game_over`, THE Score_Manager SHALL comparar el Score actual con el High_Score almacenado.
5. IF el Score actual es mayor que el High_Score almacenado, THEN THE Score_Manager SHALL actualizar el High_Score con el Score actual.
6. THE Score_Manager SHALL persistir el High_Score usando `localStorage` del navegador para que sobreviva entre sesiones.
7. THE Renderer SHALL mostrar tanto el Score final como el High_Score en la pantalla de `game_over`.

---

### Requirement 6: Renderizado Visual

**User Story:** Como jugador, quiero que el juego tenga un aspecto visual atractivo y fluido, para que la experiencia sea agradable.

#### Acceptance Criteria

1. THE Renderer SHALL dibujar todos los elementos del juego en un Canvas HTML5 con resolución de 480 × 640 píxeles.
2. THE Renderer SHALL limpiar el Canvas completo al inicio de cada frame antes de redibujar todos los elementos.
3. THE Renderer SHALL dibujar un fondo con gradiente de cielo (azul claro) en cada frame.
4. THE Renderer SHALL dibujar el Bird como un círculo o sprite de al menos 30 × 30 píxeles con un color o imagen distintiva.
5. THE Renderer SHALL dibujar cada Pipe con un color verde distintivo y un borde más oscuro para dar sensación de profundidad.
6. THE Renderer SHALL dibujar una franja de suelo en la parte inferior del Canvas con un color marrón o verde oscuro.
7. THE Game_Loop SHALL ejecutarse a 60 frames por segundo usando `requestAnimationFrame` para garantizar animación fluida.
8. WHERE el dispositivo soporte animaciones a 60 FPS, THE Renderer SHALL mantener la tasa de refresco sin caídas perceptibles durante el estado `playing`.

---

### Requirement 7: Control del Jugador

**User Story:** Como jugador, quiero poder controlar el pájaro usando teclado, ratón y pantalla táctil, para que el juego sea accesible en distintos dispositivos.

#### Acceptance Criteria

1. THE Input_Handler SHALL detectar la pulsación de la tecla `Space` o `ArrowUp` como acción de salto.
2. THE Input_Handler SHALL detectar un clic del ratón (botón izquierdo) sobre el Canvas como acción de salto.
3. THE Input_Handler SHALL detectar un evento `touchstart` sobre el Canvas como acción de salto en dispositivos táctiles.
4. WHEN se detecta una acción de salto durante el estado `playing`, THE Input_Handler SHALL notificar al Physics_Engine para aplicar la Velocity de salto.
5. WHEN se detecta una acción de salto durante el estado `idle`, THE Input_Handler SHALL notificar al Game para iniciar la partida.
6. WHEN se detecta una acción de salto durante el estado `game_over`, THE Input_Handler SHALL notificar al Game para reiniciar la partida.
7. THE Input_Handler SHALL ignorar acciones de salto múltiples registradas en el mismo frame para evitar saltos duplicados.

---

### Requirement 8: Accesibilidad y Compatibilidad

**User Story:** Como jugador, quiero que el juego funcione correctamente en los navegadores modernos más comunes, para que pueda jugarlo sin instalar nada.

#### Acceptance Criteria

1. THE Game SHALL ejecutarse correctamente en las versiones actuales de Chrome, Firefox, Safari y Edge sin requerir plugins adicionales.
2. THE Canvas SHALL escalar proporcionalmente al tamaño de la ventana del navegador manteniendo la relación de aspecto 3:4 (480 × 640).
3. THE Game SHALL ser completamente funcional usando únicamente HTML5, CSS3 y JavaScript vanilla sin dependencias externas de terceros.
4. IF el navegador no soporta el elemento Canvas HTML5, THEN THE Game SHALL mostrar un mensaje de error indicando que el navegador no es compatible.
5. THE Game SHALL tener un título de página (`<title>`) descriptivo y un atributo `aria-label` en el Canvas para lectores de pantalla.
