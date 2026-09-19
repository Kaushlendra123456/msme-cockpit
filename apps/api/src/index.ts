import dotenv from "dotenv";
import http from "http";
import { Server as SocketIOServer } from "socket.io";
import { createApp } from "./app";
import { logger } from "./config/logger";

dotenv.config();

const app = createApp();
const server = http.createServer(app);

const io = new SocketIOServer(server, {
  cors: { origin: "*" }, // tighten this to your frontend URL in production
});

// Make the io instance available to controllers if they need to emit events,
// e.g. io.to(businessId).emit('inventory:low-stock', payload)
app.set("io", io);

io.on("connection", (socket) => {
  // Each client joins a room named after their businessId so events only
  // reach users of the same tenant.
  socket.on("join-business", (businessId: string) => {
    socket.join(businessId);
  });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  logger.info(`MSME Cockpit API running on port ${PORT}`);
  logger.info(`API docs available at http://localhost:${PORT}/api-docs`);
});