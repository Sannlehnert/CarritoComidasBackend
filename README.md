
---

# 🛠️ Backend – Sistema de Pedidos en Tiempo Real

```md
# 🔧 Sistema de Pedidos – Backend

Backend del sistema de pedidos en tiempo real para carritos de comida.  
Se encarga de gestionar órdenes, guardarlas en base de datos y notificar a los clientes conectados (cajero y cocina).

Pensado para funcionar tanto **en red local** como en la nube.

---

## 🧠 Qué hace el backend

- Crear pedidos y guardarlos en MySQL
- Manejar estados de pedidos (pendiente, en preparación, listo)
- Emitir eventos en tiempo real con Socket.IO
- Evitar pedidos duplicados (idempotencia)
- Servir como punto central entre cajero y cocina

---

## 🧱 Tecnologías usadas

- 🟢 Node.js
- 🚀 Express
- 📡 Socket.IO
- 🗄️ MySQL
- 🔐 Validaciones básicas y control de errores

---

## 📡 Realtime (Socket.IO)

Eventos principales:
- `nueva-orden` → cuando se crea un pedido
- `orden-actualizada` → cuando cambia el estado

Los clientes se sincronizan automáticamente al conectarse o reconectarse.

---

## 🗃️ Base de datos

Tablas principales:
- `ordenes`
- `orden_items`

Relación 1 a N entre órdenes y sus items.  
Uso de transacciones para mantener consistencia.

---

## 🔌 Endpoints principales

- `POST /ordenes` → crear pedido
- `GET /ordenes` → listar pedidos
- `PATCH /ordenes/:id` → actualizar estado

---

## 🚀 Cómo correr el servidor

```bash
npm install
npm run dev
