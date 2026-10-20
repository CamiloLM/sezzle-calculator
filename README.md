# Calculator Sezzle

A calculator with a Go REST API backend. The frontend is not implemented yet; its planned behavior is described in [Using the calculator](#using-the-calculator).

## Requirements

- [Docker](https://docs.docker.com/get-docker/) with Docker Compose v2 (`docker compose`)
- To run the backend without Docker: [Go](https://go.dev/dl/) 1.27.2 or newer

## How to run

### With Docker Compose (recommended)

From the project root:

```bash
docker compose up --build
```

The API is available at `http://localhost:8080`. Press `Ctrl+C` to stop it, or run it in the background with `docker compose up --build -d` and stop it with `docker compose down`.

The image build runs the backend tests first, so the build fails if any test fails.

After about 10 seconds, `docker compose ps` should show the backend as `healthy`.

### Without Docker

```bash
cd backend
go run ./cmd/server
```

### Running the tests

```bash
cd backend
go test ./...
```

With a coverage report:

```bash
go test -coverprofile=coverage.out ./...
go tool cover -html=coverage.out -o coverage.html
```

### Configuration

| Variable | Default | Description |
|---|---|---|
| `PORT` | `8080` | Port the API listens on |

To change the port with Docker Compose, update both `PORT` and the `ports` mapping in `docker-compose.yml`.

CORS only allows requests from `http://localhost:5173` (set in `backend/internal/api/router.go`).

## Examples

### Endpoints

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/health` | Health check, returns `{"status":"ok"}` |
| `POST` | `/api/v1/calculate` | Performs a calculation |

### Operations

The request body is JSON with the fields `operation`, `a` and `b`.

| `operation` | Result | Needs `b` |
| --- | --- | --- |
| `add` | `a + b` | Yes |
| `subtract` | `a - b` | Yes |
| `multiply` | `a * b` | Yes |
| `divide` | `a / b` | Yes |
| `power` | `a` to the power of `b` | Yes |
| `sqrt` | Square root of `a` | No |
| `percentage` | `b` percent of `a` (`a * b / 100`) | Yes |

### Requests

```bash
curl -X POST http://localhost:8080/api/v1/calculate \
  -H "Content-Type: application/json" \
  -d '{"operation": "add", "a": 2, "b": 3}'
# {"result":5}

curl -X POST http://localhost:8080/api/v1/calculate \
  -H "Content-Type: application/json" \
  -d '{"operation": "sqrt", "a": 16}'
# {"result":4}

curl -X POST http://localhost:8080/api/v1/calculate \
  -H "Content-Type: application/json" \
  -d '{"operation": "percentage", "a": 200, "b": 15}'
# {"result":30}
```

### Errors

Invalid requests return status `400` with an `error` message:

```bash
curl -X POST http://localhost:8080/api/v1/calculate \
  -H "Content-Type: application/json" \
  -d '{"operation": "divide", "a": 1, "b": 0}'
# {"error":"cannot divide by zero"}
```

| Case | `error` |
| --- | --- |
| Malformed JSON or unknown fields | `JSON is invalid` |
| Missing `operation` | `the field 'operation' is necessary` |
| Missing `a` | `the field 'a' is necessary` |
| Missing `b` (except for `sqrt`) | `the field 'b' is necessary` |
| Division by zero | `cannot divide by zero` |
| Square root of a negative number | `cannot take the square root of a negative number` |
| Unsupported operation | `unknown operation` |
| Result is NaN or infinite (e.g. a very large `power`) | `result is not defined` |

## Using the calculator

> Planned behavior for the frontend, which is not implemented yet. Every calculation is done by the API; typing, deleting and clearing happen only in the browser.

### Keys

| Key | Behavior | API `operation` |
| --- | --- | --- |
| `0`–`9` | Enters digits, up to 12. Leading zeros are dropped. | — |
| `.` | Adds a decimal point, one per number (`.7` becomes `0.7`). | — |
| `+` `−` `×` `÷` `xʸ` | Stores and highlights the operator. If a second number was entered, the pending operation is computed first. Pressing another operator replaces it. With no number entered, `−` starts a negative number and the others are ignored. | `add`, `subtract`, `multiply`, `divide`, `power` |
| `=` | Computes the pending operation. With no second number it reuses the displayed one (`5 × =` gives `25`). Pressed again, it repeats the last operation (`5 × 2 = =` gives `20`). | Same as the operator |
| `√` | Square root of the displayed number, applied immediately. With an operator pending, the result becomes the second number. | `sqrt` |
| `%` | Alone, divides by 100 (`50 %` gives `0.5`). After `+` or `−`, turns the second number into that percent of the first (`200 + 10 %` shows `20`, then `=` gives `220`). After `×`, `÷` or `xʸ`, divides the second number by 100. | `percentage` |
| `DEL` | Removes the last digit while typing, falling back to `0`. Does nothing on a result. | — |
| `AC` | Resets everything. | — |

### General behavior

- **Left to right:** there is no operator precedence, so `1 + 3 × 5` gives `20`.
- **Errors:** division by zero, the square root of a negative number and undefined results show the API's `error` message. A network failure shows "Can't reach server". The next digit or `AC` clears the error.
- **Display:** results are rounded to about 12 significant digits, and very large or very small values use exponent notation.
- **Busy:** input is ignored while a request is in flight.
- **Keyboard:** every key also works from the keyboard while the calculator has focus.

## Decisions

### Backend

- **Language and router:** Go with [chi](https://github.com/go-chi/chi) for routing, plus [go-chi/cors](https://github.com/go-chi/cors) for CORS.
- **Structure:** the arithmetic logic (`internal/calculator`) is separate from the HTTP layer (`internal/api`), so each can be tested on its own.
- **Request validation:** `a` and `b` are pointers, so a missing field is distinguished from a value of `0`. Unknown JSON fields are rejected, and request bodies are limited to 1 MB.
- **Undefined results:** results that are NaN or infinite are returned as errors instead of being sent in the response.

### Docker

- **Multi-stage build:** the code is compiled in a `golang:1.27-alpine` stage, and only the binary is copied into a small `alpine:3.22` runtime image.
- **Tests in the build:** `go test ./...` runs before the binary is compiled, so an image is never built from code with failing tests.
- **Smaller binary:** built with `CGO_ENABLED=0`, `-trimpath` and `-ldflags="-s -w"`.
- **Non-root user:** the server runs as the unprivileged `app` user.
- **Health check:** Docker Compose checks `/health` every 10 seconds using `wget`, which is included in Alpine.
- **`.dockerignore`:** coverage reports, test binaries and `bin/` are kept out of the build.

## Prompts

1. (2026-10-19 14:43) Suggest me different architectures for a Calculator application with backend in Go and fron with React
2. (2026-10-19 14:50) From a Python developer point of view. What are the best approaches to do a Go application based on familiarity, ease of use and complexity given the calculador API scope? Make a comparison of the base library and frameworks
3. (2026-10-19 15:16) Search for guides and tutorials on how to use chi to make and API
4. (2026-10-19 17:06) How does go works without classes? What's the equivalent in Python?
5. (2026-10-19 17:08) What is the operator := ?
6. (2026-10-19 17:27) For go version 1.27.2 create a Dockerfile and update docker-compose.yml
7. (2026-10-19 19:18) I have these ideas for the calculator usage. Summarize and update the README where necessary
8. (2026-10-19 18:49) This is my logic for the calcultator. Click and type are treated the same, suppose I write both. I click a number, it gets render (suppose 5) in the screen of the calculator
  I click and operation (suppose *) , it gets highlighted.
  If I click another operation it changes to that (suppose +)
  If i type another number (suppose 2) the operation is made and it renders on screen the result (assuming * is highlighted 10 is rendered)
  If I click equal it uses the same number as the other name (assuming * is highlighted 25 is rendered). Am I missing anything?
9. (2026-10-19 19:15) Give me a summary of the calculator operations and logic
10. (2026-10-19 19:19) Update the README.md file where necessary