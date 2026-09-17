# Consigna: llevá tu API a "Agentic First"

Tu API de cursos ya cumple los Bloques 01 a 06 (rutas, `express.json()`, logger, controllers separados, manejo de errores centralizado, `express.Router()` montado en `/api/cursos`). Esta consigna toma esa misma base y le suma los 5 principios de diseño para agentes de IA que vimos en el Bloque 04 (diapositivas 24-27).

**No te doy el código completo a propósito** — cada parte tiene pistas escalonadas: probá primero con la pista corta, y si te trabás, mirá la siguiente. La idea es que llegues vos a la solución, no que la copies.

Un dato importante: tu `middleware/errorHandler.js` actual usa una **función** (`crearError(message, status)`), no una clase — seguí con ese mismo estilo en todo lo que sigue, no hace falta `class`/`extends` en ningún momento.

---

## Parte 1 — Endpoint con intención de negocio

**Objetivo:** en vez de forzar a quien consume la API a hacer un `GET` para leer cuántos inscriptos tiene un curso y despues un `PUT`/`PATCH` con el objeto entero recalculado, exponé la ACCIÓN directamente: "inscribir un alumno".

**Pista inicial:**
- Sumale dos campos a cada curso de `controllers/cursos.controller.js`: `cupos` e `inscriptos` (por ejemplo, `cupos: 30, inscriptos: 12` en uno, y otro curso con `inscriptos` igual a `cupos` para poder probar el caso sin cupo).
- Pensá qué método HTTP corresponde para "hacer algo que no es leer, ni crear un recurso nuevo, ni reemplazar uno entero". ¿`GET`? ¿`POST`? ¿A qué URL — `/cursos/:id` o algo más específico?

**Si te trabaste:**
- El método es `POST`, y la URL debería dejar clara la acción: `/:id/inscribir` (relativo al router, así que termina siendo `/api/cursos/:id/inscribir`).
- La función del controller necesita: buscar el curso por id (ya sabés hacer esto, es igual que en `obtenerCurso`), fijarse si `inscriptos >= cupos`, y si hay cupo, sumar 1 a `inscriptos` y devolver el curso actualizado.
- ¿Qué status corresponde si no hay cupo? Pensalo en términos de "la operación choca con el estado actual del recurso" — no es un 400 (el request está bien armado), no es un 404 (el curso existe).

**Cómo probarlo (esto sí te lo doy completo, para que sepas si te funcionó):**

```bash
curl -X POST http://localhost:3000/api/cursos/1/inscribir
curl -X POST http://localhost:3000/api/cursos/2/inscribir
```

En Postman: `POST http://localhost:3000/api/cursos/1/inscribir` y `.../2/inscribir`, sin body en ninguno de los dos.

**Listo cuando:** el primer curso suma un inscripto y te devuelve el curso actualizado; el segundo (si lo dejaste sin cupo) te devuelve un error, no un 200.

---

## Parte 2 — Errores estructurados (RFC 9457)

**Objetivo:** en vez de `{ data: null, error: { message } }`, cada error va a traer cinco campos: `type` (una URL estable que identifica el tipo de error), `title`, `status`, `detail` y `instance` (qué request específico falló).

**Pista inicial:**
- Tu `crearError(message, status)` actual recibe dos parámetros sueltos. Vas a necesitar más datos con nombre propio (`type`, `title`, `detail`) — ¿qué forma de recibir argumentos en JS te permite eso sin que el orden importe?
- Pensá: `instance` es "qué request falló". Dentro de `errorHandler(err, req, res, next)`, ¿qué objeto tenés ahí que ya sabe la URL de la request actual?

**Si te trabaste:**
- Cambiá la firma de `crearError` para que reciba un solo objeto: `crearError({ type, title, status, detail })`. Adentro, seguís haciendo `new Error(...)` y agregándole propiedades — ahora son más de una.
- `req.originalUrl` es lo que necesitás para `instance`, y eso se arma en el `errorHandler`, no en `crearError` (el error no sabe en qué request ocurrió — eso lo sabe el middleware que lo atrapa).
- Vas a tener que volver a las tres funciones del controller que ya llaman a `crearError` (`obtenerCurso`, `crearCurso` si lo actualizaste, e `inscribirAlumno` de la Parte 1) y cambiar cómo lo llaman, porque cambiaste la firma.

**Cómo probarlo:**

```bash
curl http://localhost:3000/api/cursos/999
curl -X POST http://localhost:3000/api/cursos -H "Content-Type: application/json" -d '{}'
curl -X POST http://localhost:3000/api/cursos/2/inscribir
```

En Postman: los mismos tres — `GET /api/cursos/999`, `POST /api/cursos` con body `{}`, `POST /api/cursos/2/inscribir` sin body.

**Listo cuando:** los tres errores anteriores devuelven un JSON con `type`, `title`, `status`, `detail` e `instance` — no solo un `message` suelto.

---

## Parte 3 — Documentar el contrato con OpenAPI

**Objetivo:** un archivo que describa cada endpoint, para que alguien (o algo) que nunca vio tu código sepa cómo usar la API.

Esta parte no tiene "pistas escalonadas" porque es sintaxis nueva (YAML), así que te doy el esqueleto con huecos para completar — llenalos vos:

Crear `openapi.yaml` en la raíz del proyecto:

```yaml
openapi: 3.0.0
info:
  title: # TODO: ponele un nombre a tu API
  version: 1.0.0
servers:
  - url: http://localhost:3000
paths:
  /api/cursos:
    get:
      summary: # TODO
      responses:
        '200':
          description: # TODO
    post:
      summary: # TODO
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [nombre, horas]
              properties:
                nombre:
                  type: string
                horas:
                  type: integer
      responses:
        '201':
          description: # TODO
        '400':
          $ref: '#/components/responses/Error'
  /api/cursos/{id}:
    get:
      summary: # TODO
      parameters:
        - in: path
          name: id
          required: true
          schema:
            type: integer
      responses:
        '200':
          description: # TODO
        '404':
          $ref: '#/components/responses/Error'
  /api/cursos/{id}/inscribir:
    post:
      summary: # TODO — describí la ACCIÓN, no solo "hace un post"
      parameters:
        # TODO: mismo parámetro "id" que en el endpoint de arriba
      responses:
        '200':
          description: # TODO
        '404':
          $ref: '#/components/responses/Error'
        '409':
          description: # TODO
components:
  responses:
    Error:
      description: Error siguiendo RFC 9457 (Problem Details)
      content:
        application/json:
          schema:
            type: object
            properties:
              type:
                type: string
              title:
                type: string
              status:
                type: integer
              detail:
                type: string
              instance:
                type: string
```

**Cómo probarlo:** no se "corre" — abrilo en Postman con `Import` → `File`, y fijate que te arma una colección con tus cuatro endpoints. Si algo te queda confuso al mirarlo en Postman, es una señal de que ese campo del YAML necesita más detalle.

**Listo cuando:** no queda ningún `# TODO` sin completar, y los cuatro endpoints están documentados con sus posibles errores.

---

## Parte 4 — Idempotencia

**Objetivo:** si alguien (o un agente de IA) manda el mismo `POST` dos veces con la misma clave `Idempotency-Key` — por ejemplo porque no está seguro si el primero llegó a procesarse —, tu API no debería crear el recurso dos veces.

**Pista inicial:**
- Vas a necesitar guardar, en algún lado que persista entre requests, qué claves ya viste y qué le respondiste a cada una. ¿Qué estructura de JS te sirve para guardar pares clave-valor?
- ¿Con qué método de Express leés un header custom de la request?

**Si te trabaste:**
- Un `Map` a nivel de módulo (fuera de la función del middleware, para que no se resetee en cada request) es suficiente para esta demo.
- `req.header('Idempotency-Key')` te da el valor del header (o `undefined` si no vino).
- La lógica del middleware, en pseudocódigo:
  ```js
  const procesadas = new Map()

  export function idempotency(req, res, next) {
    const key = req.header('Idempotency-Key')
    if (!key) return next() // sin key, se comporta como siempre

    if (procesadas.has(key)) {
      // TODO: ya viste esta key antes — devolvé lo que guardaste, sin ejecutar el controller
    }

    // TODO: dejar pasar la request (next()), pero antes "engancharte" a res.json
    //       para guardar en `procesadas` lo que el controller termine respondiendo
  }
  ```
- La parte más difícil es "engancharte" a `res.json`: probá guardar la función original (`res.json.bind(res)`) y reemplazar `res.json` por una versión tuya que primero guarda en el `Map` y después llama a la original.
- Usalo como middleware solo en las rutas que crean o modifican algo (`router.post('/', idempotency, crearCurso)`).

**Cómo probarlo:**

```bash
curl -X POST http://localhost:3000/api/cursos -H "Content-Type: application/json" -H "Idempotency-Key: demo1" -d '{"nombre": "Repetido", "horas": 10}'
curl -X POST http://localhost:3000/api/cursos -H "Content-Type: application/json" -H "Idempotency-Key: demo1" -d '{"nombre": "Repetido", "horas": 10}'
```

En Postman: `POST /api/cursos`, Body → raw → JSON con `{"nombre": "Repetido", "horas": 10}`, y en la pestaña Headers agregá `Idempotency-Key: demo1`. Mandala dos veces sin cambiar nada.

**Listo cuando:** las dos respuestas son idénticas (mismo `id`), y si sacás el header y repetís, ahí sí te crea un curso nuevo cada vez.

---

## Parte 5 — Rate limiting consciente

**Objetivo:** que la API cuente cuántas requests le hizo cada cliente en el último minuto, y avise el límite en cada respuesta con headers estándar — distinguiendo, si es posible, tráfico humano de tráfico de agentes.

**Pista inicial:**
- Necesitás algo similar a la Parte 4 (un `Map` que persista entre requests), pero esta vez guardando un contador y cuándo se resetea, por cliente.
- ¿Con qué dato identificás "de dónde viene" una request en Express?

**Si te trabaste:**
- `req.ip` te da la IP del cliente. Podés combinarla con un header propio, por ejemplo `X-Client-Type` (`req.header('X-Client-Type') || 'humano'`), para simular que un agente se identifica distinto a un humano.
- Guardá en el `Map` algo como `{ count, resetAt }` por cada combinación IP + tipo de cliente. En cada request: si ya pasó `resetAt`, resetealo a 0; sumale 1 al `count`.
- Los headers de respuesta se ponen con `res.set('X-RateLimit-Limit', ...)` y `res.set('X-RateLimit-Remaining', ...)`, ANTES de decidir si cortás la request o no.
- Si el contador supera el límite que elijas (por ejemplo 20 por minuto), respondé `429` en vez de llamar a `next()`.
- Montalo en `server.js`, cerca del principio — después del logger, antes de `express.json()`.

**Cómo probarlo:**

```bash
curl -i http://localhost:3000/api/cursos
```

En Postman: `GET /api/cursos`, mandala varias veces seguidas y mirá la pestaña **Headers** de la respuesta (no del request).

**Listo cuando:** cada respuesta trae `X-RateLimit-Limit` y `X-RateLimit-Remaining`, y el segundo baja de a uno en cada request.

---

## Checklist final

Cuando termines las 5 partes, tu proyecto debería tener esta estructura (además de lo que ya tenías de los Bloques 01-06):

```
proyecto-clase-8/
+-- server.js
+-- openapi.yaml
+-- routes/
|   `-- cursos.routes.js
+-- controllers/
|   `-- cursos.controller.js
+-- middleware/
|   +-- logger.js
|   +-- errorHandler.js
|   +-- idempotency.js
|   `-- rateLimiter.js
+-- package.json
```

- [ ] Parte 1 — `POST /api/cursos/:id/inscribir` funciona y respeta el cupo
- [ ] Parte 2 — todos los errores de la API tienen `type`, `title`, `status`, `detail`, `instance`
- [ ] Parte 3 — `openapi.yaml` sin ningún `# TODO` pendiente
- [ ] Parte 4 — dos POST con la misma `Idempotency-Key` no duplican el recurso
- [ ] Parte 5 — las respuestas traen headers `X-RateLimit-*`
