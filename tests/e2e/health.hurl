# Health check
GET http://localhost:3000/health
HTTP 200
[Asserts]
jsonpath "$.status" == "ok"

# OpenAPI spec available
GET http://localhost:3000/openapi.json
HTTP 200
[Asserts]
jsonpath "$.openapi" == "3.1.0"
jsonpath "$.info.title" == "ts-backend-harness API"
