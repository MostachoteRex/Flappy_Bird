# 🐦 Flappy Bird — HTML5

Clon del clásico juego **Flappy Bird** construido con HTML5 Canvas y JavaScript vanilla, sin dependencias externas en tiempo de ejecución.

---

## Capturas de pantalla

| Pantalla de inicio | En juego | Game Over |
|:-:|:-:|:-:|
| ![Pantalla de inicio](docs/screenshots/start.png) | ![En juego](docs/screenshots/gameplay.png) | ![Game Over](docs/screenshots/gameover.png) |

---

## Características

- 🎮 Control por teclado (Espacio / Flecha arriba), clic del ratón y toque táctil
- 🏆 Puntuación en tiempo real y registro del mejor puntaje (guardado en `localStorage`)
- 🌊 Física suave con gravedad y velocidad de caída máxima configurables
- 📱 Diseño responsivo que se adapta al tamaño de la ventana manteniendo la proporción 3:4
- ♿ Canvas con atributo `aria-label` para accesibilidad básica
- 🧪 Suite de tests unitarios y de propiedades con Jest y fast-check

---

## Tecnologías

| Tecnología | Uso |
|---|---|
| HTML5 Canvas | Renderizado del juego |
| JavaScript (ES6+) | Lógica del juego, sin frameworks |
| CSS3 | Estilos y escalado responsivo |
| Jest 29 | Tests unitarios |
| fast-check 3 | Tests basados en propiedades |

---

## Estructura del proyecto

```
flappy-bird/
├── index.html              # Punto de entrada
├── css/
│   └── style.css           # Estilos y layout responsivo
├── js/
│   ├── main.js             # Bootstrap: inicializa y arranca el juego
│   ├── game.js             # Orquestador principal + máquina de estados
│   ├── bird.js             # Entidad del pájaro
│   ├── physics.js          # Motor de física (gravedad, salto)
│   ├── pipe.js             # Entidad de tubería
│   ├── pipeManager.js      # Generación y gestión de tuberías
│   ├── collision.js        # Detección de colisiones
│   ├── scoreManager.js     # Puntuación y high score
│   ├── inputHandler.js     # Manejo de entradas (teclado, ratón, táctil)
│   ├── renderer.js         # Renderizado en canvas
│   └── __tests__/          # Tests unitarios y de propiedades
├── package.json
└── jest.config.js
```

---

## Cómo jugar

1. Abre `index.html` en cualquier navegador moderno (no requiere servidor).
2. Presiona **Espacio**, **Flecha arriba**, haz **clic** o **toca** la pantalla para iniciar.
3. Mantén al pájaro volando pasando por los huecos entre las tuberías.
4. Cada tubería superada suma **1 punto**.
5. Al chocar con una tubería o el suelo, aparece la pantalla de **Game Over**.
6. Presiona de nuevo para reiniciar.

### Controles

| Acción | Control |
|---|---|
| Saltar / Iniciar / Reiniciar | `Espacio` |
| Saltar / Iniciar / Reiniciar | `Flecha arriba ↑` |
| Saltar / Iniciar / Reiniciar | Clic izquierdo |
| Saltar / Iniciar / Reiniciar | Toque táctil |

---

## Máquina de estados

El juego sigue un ciclo de tres estados:

```
idle ──(input)──► playing ──(colisión)──► game_over
  ▲                                           │
  └───────────────(input)─────────────────────┘
```

---

## Instalación y tests

Requiere [Node.js](https://nodejs.org/) solo para ejecutar los tests.

```bash
# Instalar dependencias de desarrollo
npm install

# Ejecutar todos los tests
npm test
```

La suite incluye:
- **Tests unitarios** para cada módulo (`bird`, `physics`, `pipe`, `pipeManager`, `collision`, `scoreManager`, `inputHandler`, `renderer`, `game`, `main`)
- **Tests de propiedades** (property-based) con fast-check para física, colisiones, puntuación e inputs

---

## Física del juego

| Parámetro | Valor |
|---|---|
| Gravedad | `0.28 px/frame²` |
| Velocidad de salto | `-6 px/frame` |
| Velocidad máxima de caída | `8 px/frame` |
| Resolución del canvas | `480 × 640 px` |

---

## Licencia

Proyecto de uso educativo.
