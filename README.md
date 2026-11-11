# Star Shooter

Shooter arcade vertical (estilo Space Invaders) hecho con **Phaser 3 + TypeScript estricto + Vite**. Un solo jugador, 3 vidas, oleadas de enemigos cada vez más rápidas, puntuación y récord persistente en `localStorage`. Pensado para publicarse como web estática en tu propia página.

## Controles

- **Teclado**: flechas o WASD para moverse, `Espacio` para disparar, `P` pausa, `R` reiniciar tras game over.
- **Táctil** (móvil): botones en pantalla ◀ ▶ y FUEGO; toca la pantalla para reiniciar tras game over.

## Ejecutar en local

```bash
npm install
npm run dev
```

## Build de producción (para publicar en tu web)

```bash
npm run build
```

Genera `dist/` (estático). Sube el contenido de `dist/` a tu hosting (por ejemplo en `/juegos/star-shooter/`) y enlázalo desde tu web. El juego usa `base: './'`, así que funciona en cualquier subruta.

## Ejecutar con Docker/Podman (sin instalar Node en tu equipo)

El `Dockerfile` es multi-stage: compila el juego con `node:22-alpine` (typecheck + build dentro del contenedor) y sirve el `dist/` con `nginx:alpine` en el puerto 8080. No hace falta `docker-compose`: un contenedor suelto vale.

**De golpe (recomendado):**

```bash
./scripts/run-container.sh          # compila la imagen y levanta el juego
# luego abre http://localhost:8080
./scripts/run-container.sh down     # para y borra el contenedor
```

El script detecta solo si tienes `podman` o `docker`. Para cambiar el puerto: `PORT=9000 ./scripts/run-container.sh`.

**A mano:**

```bash
podman build -t star-shooter .
podman run -d --name star-shooter -p 8080:80 star-shooter
# con Docker: docker build -t star-shooter . && docker run -d --name star-shooter -p 8080:80 star-shooter
```

Para parar y borrar el contenedor: `podman stop star-shooter && podman rm star-shooter` (o `docker stop/rm`).

Para desplegar en tu servidor web: ejecuta el mismo script en el servidor (o sube la imagen con `podman push`), o simplemente copia el `dist/` generado en local con `npm run build`.

## Verificación

```bash
npm run typecheck   # tsc --noEmit estricto
npm run build       # build de producción
```

CI (GitHub Actions) ejecuta `npm ci`, `typecheck` y `build` en cada PR a `main`.

## Estructura

- `src/main.ts` — configuración de Phaser (800x600, `Scale.FIT`, Arcade Physics).
- `src/scenes/PreloadScene.ts` — genera los sprites con `generateTexture` (sin assets externos).
- `src/scenes/GameScene.ts` — jugabilidad: jugador, disparo con pooling, oleadas, colisiones, HUD, vidas, game over, táctil.
- `src/systems/AudioFX.ts` — efectos de sonido sintetizados con WebAudio (sin archivos de audio).
- `src/config.ts` — constantes del juego.

## Sustituir sprites por arte real

Los sprites actuales son placeholders generados por código. Para usar arte real (p. ej. Kenney Space Shooter Redux, CC0), coloca los PNG en `public/assets/` y cárgalos en `PreloadScene` con `this.load.image(...)` usando las mismas claves (`player`, `enemy`, `bullet`, `explosion`, `star`).

## Checklist de QA manual (probar en navegador)

- [ ] La nave se mueve con flechas/WASD y no sale de la pantalla.
- [ ] Disparo con espacio con cooldown; las balas desaparecen al salir por arriba.
- [ ] Las oleadas aparecen y el texto "OLEADA N" se muestra.
- [ ] Bala contra enemigo: explosión + 100 puntos.
- [ ] Enemigo que llega abajo o choca con la nave: pierde una vida y hay invulnerabilidad temporal.
- [ ] A las 3 vidas perdidas: GAME OVER, récord guardado, R reinicia.
- [ ] En móvil: botones táctiles funcionan y el juego encaja en pantalla (`Scale.FIT`).
- [ ] `P` pausa y reanuda.
