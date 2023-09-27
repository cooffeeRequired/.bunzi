# Bunzi

Bun: 1.0.3

Tested at: 21:37, September 27th, 2023

## OS Details
- Cores: 12
- Model: AMD Ryzen 5 3600X 6-Core Processor
- OS: Linux
- System memory: 11.6GB
- Architecture: x64
## Tests
### GET `/`
Should return `Hi` as a response.
### GET `/api/hi`
Should return `Welcome` as a response.
### GET `/id/44?name=XHR`
Should return the `id` parameter value and the query value, for example `1 a` when the request path is `/id/1?name=a`.
### GET `/a/b`
Should return a response with `404` status code.
### POST `/api/json`
Return the request body with `Content-Type` set to `application/json`.
### Info
- Connections: 100
- Duration: 20s
- Using `fasthttp`: `false`
- Results are measured in requests per second.

## Results
| Name | Average | GET `/` | GET `/api/hi` | GET `/id/64?name=Rbn` | GET `/a/b` | POST `/api/json` |
|  :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| [Bunzii 0.0.41-beta](/results/main/Bunzii) | 79623.30 | 65043.50 | 73150.38 | 69775.67 | 69271.00 | 70875.93 |