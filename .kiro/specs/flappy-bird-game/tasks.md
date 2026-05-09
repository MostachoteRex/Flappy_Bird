# Plan de Implementación: Flappy Bird Game

## Visión general

Implementación incremental del juego Flappy Bird como aplicación web usando HTML5 Canvas y JavaScript vanilla. Se construye de dentro hacia afuera: primero las entidades y la lógica pura (física, colisiones, puntuación, máquina de estados), luego los gestores y el renderizado, y finalmente el cableado completo en el punto de entrada.

El framework de tests es **Jest + fast-check** para unit tests y property-based tests.

## Tareas

- [x] 1. Configurar estructura del proyecto y entorno de tests
  - Crear la estructura de directorios `flappy-bird/js/`, `flappy-bird/css/`
  - Crear `package.json` con dependencias de desarrollo: `jest`, `fast-check`, `jest-environment-jsdom`
  - Crear `jest.config.js` configurado con entorno jsdom
  - Crear `index.html` con el elemento `<canvas>` de 480×640, atributo `aria-label`, `<title>` descriptivo y mensaje de fallback para navegadores sin soporte Canvas
  - Crear `css/style.css` con estilos de centrado y escalado responsive del canvas (relación de aspecto 3:4)
  - _Requisitos: 8.1, 8.2, 8.3, 8.4, 8.5_

- [x] 2. Implementar entidades de datos: Bird y Pipe
  - [x] 2.1 Implementar la clase `Bird` en `js/bird.js`
    - Propiedades: `x`, `y`, `radius`, `velocity`
    - Método `reset()` que restaura posición y velocidad iniciales
    - Método `getBoundingBox(margin)` que devuelve `{x, y, width, height}` con hitbox reducida
    - _Requisitos: 2.1, 2.2, 2.3, 4.3_

  - [x] 2.2 Escribir property test para `Bird.getBoundingBox`
    - **Property 6 (parcial): El bounding box con margen siempre tiene dimensiones estrictamente menores que el sprite completo y está centrado dentro de él**
    - **Valida: Requisito 4.3**

  - [x] 2.3 Implementar la clase `Pipe` en `js/pipe.js`
    - Propiedades: `x`, `gapY`, `gapHeight`, `width`, `scored`
    - Métodos `getBoundingBoxTop()`, `getBoundingBoxBottom()`, `isOffScreen(canvasWidth)`
    - _Requisitos: 3.2, 3.3, 4.2_

  - [x] 2.4 Escribir unit tests para `Bird` y `Pipe`
    - Verificar que `getBoundingBox` aplica el margen correctamente en los cuatro lados
    - Verificar que `isOffScreen` retorna `true` cuando `pipe.x + pipe.width < 0`
    - _Requisitos: 4.3, 3.5_

- [x] 3. Implementar la máquina de estados (`StateMachine` dentro de `Game`)
  - [x] 3.1 Implementar la lógica de `setState` y `getState` en `js/game.js`
    - Estado inicial: `idle`
    - Transiciones válidas: `idle` → `playing`, `playing` → `game_over`, `game_over` → `idle`
    - Transiciones inválidas deben ser ignoradas silenciosamente o lanzar error
    - _Requisitos: 1.1, 1.3, 1.4, 1.5, 1.6_

  - [x] 3.2 Escribir property test para transiciones de estado
    - **Property 1: Para cualquier estado actual y cualquier acción, el estado resultante siempre pertenece a `{idle, playing, game_over}` y solo se producen transiciones válidas según la secuencia definida**
    - **Valida: Requisitos 1.1, 1.3, 1.4, 1.5, 1.6**

  - [x] 3.3 Escribir unit tests para la máquina de estados
    - Verificar que `idle` → `game_over` es rechazada
    - Verificar que `playing` → `idle` es rechazada
    - Verificar que el ciclo completo `idle` → `playing` → `game_over` → `idle` funciona
    - _Requisitos: 1.6_

- [x] 4. Implementar el motor de física (`PhysicsEngine`)
  - [x] 4.1 Implementar la clase `PhysicsEngine` en `js/physics.js`
    - Constructor con parámetros `gravity=0.5`, `jumpVelocity=-8`, `maxFallVelocity=12`
    - Método `update(bird)`: aplica `bird.velocity = clamp(bird.velocity + gravity, -Infinity, maxFallVelocity)` y luego `bird.y += bird.velocity`
    - Método `jump(bird)`: asigna `bird.velocity = jumpVelocity`
    - _Requisitos: 2.1, 2.2, 2.3, 2.4_

  - [x] 4.2 Escribir property test para la física del pájaro
    - **Property 2: Para cualquier velocidad inicial y cualquier número de frames sin salto, la velocidad se incrementa en exactamente 0.5 px/frame por frame, nunca supera `maxFallVelocity`, y la posición Y es la suma acumulada de velocidades aplicadas**
    - **Valida: Requisitos 2.1, 2.3, 2.4**

  - [x] 4.3 Escribir property test para la acción de salto
    - **Property 3: Para cualquier estado del pájaro (posición y velocidad arbitrarias), tras aplicar `jump()`, la velocidad vertical es exactamente -8 px/frame**
    - **Valida: Requisito 2.2**

  - [x] 4.4 Escribir unit tests para `PhysicsEngine`
    - Verificar que tras exactamente N frames sin salto la posición Y es la esperada
    - Verificar que la velocidad no supera `maxFallVelocity` aunque se apliquen muchos frames
    - _Requisitos: 2.1, 2.3, 2.4_

- [x] 5. Checkpoint — Verificar entidades y física
  - Asegurarse de que todos los tests pasan hasta este punto. Consultar al usuario si surgen dudas.

- [x] 6. Implementar el detector de colisiones (`CollisionDetector`)
  - [x] 6.1 Implementar la clase `CollisionDetector` en `js/collision.js`
    - Constante estática `HITBOX_MARGIN = 4`
    - Método estático `check(bird, pipes, canvasHeight)` que retorna `boolean`
    - Método estático privado `_aabbIntersects(rectA, rectB)` para intersección de rectángulos
    - Método estático privado `_checkBoundaries(bird, canvasHeight)` para colisión con suelo y techo
    - _Requisitos: 4.1, 4.2, 4.3, 4.4, 4.5, 2.5, 2.6_

  - [x] 6.2 Escribir property test para colisiones con límites del canvas
    - **Property 4: Para cualquier posición del pájaro, si `bird.y > canvasHeight` o `bird.y < 0`, se reporta colisión; si está dentro de los límites, no se reporta colisión por límites**
    - **Valida: Requisitos 2.5, 2.6**

  - [x] 6.3 Escribir property test para AABB con hitbox reducida
    - **Property 6: El algoritmo AABB detecta intersección si y solo si los rectángulos se solapan geométricamente; el bounding box con margen de 4px tiene dimensiones estrictamente menores que el sprite completo**
    - **Valida: Requisitos 4.2, 4.3, 4.4**

  - [x] 6.4 Escribir unit tests para `CollisionDetector`
    - Casos límite: bird exactamente en el borde de un pipe (sin colisión vs. con colisión)
    - Verificar que el margen de 4px se aplica correctamente
    - _Requisitos: 4.2, 4.3, 4.4_

- [x] 7. Implementar el gestor de tuberías (`PipeManager`)
  - [x] 7.1 Implementar la clase `PipeManager` en `js/pipeManager.js`
    - Constructor con `canvasWidth`, `canvasHeight`, `pipeSpeed=3`, `spawnInterval=1500`
    - Método `update(deltaTime)`: mueve pipes, genera nuevos según timer, elimina los que salen de pantalla
    - Método `getPipes()`: retorna la lista de pipes activos
    - Método `reset()`: limpia todos los pipes y reinicia el timer
    - Método privado `_spawnPipe()`: crea un nuevo `Pipe` con gap aleatorio válido
    - Método privado `_calculateGapY()`: `random(minPipeHeight=50, canvasHeight - gapHeight - minPipeHeight)`
    - _Requisitos: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_

  - [x] 7.2 Escribir property test para los gaps de las tuberías
    - **Property 5: Para cualquier par de tuberías generado, la tubería superior tiene ≥ 50px, la inferior tiene ≥ 50px, el gap es exactamente 150px, y la posición X inicial es igual al ancho del canvas**
    - **Valida: Requisitos 3.2, 3.3**

  - [x] 7.3 Escribir unit tests para `PipeManager`
    - Verificar que los pipes se eliminan cuando salen de pantalla
    - Verificar que se genera un nuevo pipe cada 1500ms
    - _Requisitos: 3.1, 3.5, 3.6_

- [x] 8. Implementar el gestor de puntuación (`ScoreManager`)
  - [x] 8.1 Implementar la clase `ScoreManager` en `js/scoreManager.js`
    - Constructor con `storageKey='flappyBirdHighScore'`
    - Método `reset()`: score = 0, carga highScore de localStorage
    - Métodos `getScore()` y `getHighScore()`
    - Método `checkAndScore(bird, pipes)`: detecta si `bird.x > pipe.x + pipe.width / 2` y `pipe.scored === false`, suma 1 punto y marca `pipe.scored = true`
    - Método `saveHighScore()`: persiste en localStorage con try/catch para modo privado
    - _Requisitos: 5.1, 5.2, 5.4, 5.5, 5.6_

  - [x] 8.2 Escribir property test para la unicidad del punto por tubería
    - **Property 7: Para cualquier secuencia de posiciones del pájaro y cualquier conjunto de tuberías, el score se incrementa en exactamente 1 cuando el pájaro cruza el eje central de un pipe por primera vez, y ese pipe no vuelve a contribuir puntos**
    - **Valida: Requisito 5.2**

  - [x] 8.3 Escribir property test para la persistencia del high score
    - **Property 8: Para cualquier par (scoreActual, highScorePrevio), tras `saveHighScore()`, el valor en localStorage es `max(scoreActual, highScorePrevio)`; y el round-trip de lectura devuelve el mismo valor**
    - **Valida: Requisitos 5.5, 5.6**

  - [x] 8.4 Escribir unit tests para `ScoreManager`
    - Verificar que un pipe no se cuenta dos veces aunque el bird permanezca a su derecha
    - Verificar comportamiento cuando localStorage no está disponible (mock)
    - _Requisitos: 5.2, 5.6_

- [x] 9. Checkpoint — Verificar lógica de negocio completa
  - Asegurarse de que todos los tests pasan hasta este punto. Consultar al usuario si surgen dudas.

- [x] 10. Implementar el manejador de entrada (`InputHandler`)
  - [x] 10.1 Implementar la clase `InputHandler` en `js/inputHandler.js`
    - Constructor con `canvas` y `onJump` callback
    - Métodos `attach()` y `detach()` para registrar/desregistrar event listeners
    - Listeners para `keydown` (Space, ArrowUp), `mousedown` (botón izquierdo), `touchstart`
    - Throttle con flag `_jumpedThisFrame` para prevenir saltos duplicados en el mismo frame
    - _Requisitos: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7_

  - [x] 10.2 Escribir property test para el throttle de input
    - **Property 9: Para cualquier número de eventos de salto disparados dentro del mismo frame, el callback `onJump` se invoca como máximo una vez por frame**
    - **Valida: Requisito 7.7**

  - [x] 10.3 Escribir unit tests para `InputHandler`
    - Verificar que Space y ArrowUp disparan el callback
    - Verificar que el clic izquierdo y touchstart disparan el callback
    - Verificar que `detach()` elimina los listeners correctamente
    - _Requisitos: 7.1, 7.2, 7.3_

- [x] 11. Implementar el renderizador (`Renderer`)
  - [x] 11.1 Implementar la clase `Renderer` en `js/renderer.js`
    - Constructor con `canvas` y `ctx`
    - Método público `render(state, bird, pipes, score, highScore)` que despacha según estado
    - Método privado `_renderIdle()`: pantalla de inicio con instrucciones
    - Método privado `_renderPlaying(bird, pipes, score)`: frame de juego activo
    - Método privado `_renderGameOver(score, highScore)`: pantalla de fin con score y high score
    - Métodos privados: `_clearCanvas()`, `_drawBackground()`, `_drawBird(bird)`, `_drawPipes(pipes)`, `_drawGround()`, `_drawScore(score)`
    - Bird como círculo de radio 15px con color distintivo; pipes en verde con borde oscuro; fondo con gradiente de cielo; franja de suelo marrón/verde oscuro
    - _Requisitos: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 5.3, 5.7_

  - [x] 11.2 Escribir unit tests para `Renderer` (snapshot/spy)
    - Verificar que `_clearCanvas()` se llama al inicio de cada frame
    - Verificar que `render` llama a los métodos correctos según el estado
    - _Requisitos: 6.2_

- [x] 12. Implementar el orquestador principal (`Game`) y el game loop
  - [x] 12.1 Completar la clase `Game` en `js/game.js` integrando todos los componentes
    - Constructor que recibe `canvas` e instancia `Bird`, `PhysicsEngine`, `PipeManager`, `CollisionDetector`, `ScoreManager`, `InputHandler`, `Renderer`
    - Método `init()`: inicializa todos los componentes y registra el InputHandler
    - Método `start()`: transición `idle` → `playing`, arranca el game loop con `requestAnimationFrame`
    - Método `reset()`: reinicia todos los componentes y transiciona a `idle`
    - Método `tick(timestamp)`: calcula deltaTime (limitado a 100ms), llama a `update` y `render`, solicita siguiente frame
    - Método `update(deltaTime)`: actualiza física, pipes, detecta colisiones, actualiza score; si hay colisión llama a `setState('game_over')` y `saveHighScore()`
    - Método `onJumpAction()`: delega según estado actual (`idle` → `start()`, `playing` → `physics.jump()`, `game_over` → `reset()`)
    - Fallback a `setTimeout` si `requestAnimationFrame` no está disponible
    - Manejo de errores: `window.onerror` global para errores inesperados
    - _Requisitos: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 6.7, 6.8_

  - [x] 12.2 Escribir unit tests de integración para `Game`
    - Verificar que el juego arranca sin errores en entorno jsdom
    - Verificar que `onJumpAction` en estado `idle` inicia la partida
    - Verificar que una colisión transiciona a `game_over` y llama a `saveHighScore`
    - _Requisitos: 1.3, 1.4, 5.4_

- [x] 13. Implementar el punto de entrada (`main.js`) y el escalado del canvas
  - Crear `js/main.js` que instancia `Game` con el canvas del DOM y llama a `init()`
  - Verificar soporte de Canvas (`getContext('2d')`); si es `null`, mostrar mensaje de error en el DOM
  - Implementar el listener `resize` en `css/style.css` o `main.js` para escalar el canvas manteniendo la relación de aspecto 3:4
  - _Requisitos: 8.1, 8.2, 8.3, 8.4_

  - [x] 13.1 Escribir property test para el escalado del canvas
    - **Property 10: Para cualquier tamaño de ventana del navegador, el canvas escala de forma que su ancho y alto mantienen siempre la relación de aspecto 3:4 (480:640), sin distorsión**
    - **Valida: Requisito 8.2**

  - [x] 13.2 Escribir unit tests de integración/smoke
    - Verificar que los event listeners se registran y desregistran correctamente
    - Verificar que el mensaje de error se muestra cuando Canvas no está soportado
    - _Requisitos: 8.4_

- [x] 14. Checkpoint final — Verificar integración completa
  - Asegurarse de que todos los tests pasan. Verificar que el juego arranca correctamente en el navegador. Consultar al usuario si surgen dudas.

## Notas

- Las tareas marcadas con `*` son opcionales y pueden omitirse para un MVP más rápido.
- Cada tarea referencia requisitos específicos para trazabilidad.
- Los checkpoints garantizan validación incremental en puntos clave.
- Los property tests validan propiedades universales de corrección (fast-check, mínimo 100 iteraciones).
- Los unit tests validan ejemplos específicos y casos límite.
- El orden de implementación va de la lógica pura (sin DOM) hacia el cableado final, facilitando el testing.
