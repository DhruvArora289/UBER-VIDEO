const socketIo = require("socket.io");
const userModel = require("./models/user.model");
const captainModel = require("./models/captain.model");

let io;

function initializeSocket(server) {
  io = socketIo(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    console.log(`Client connected: ${socket.id}`);

    socket.on("join", async (data) => {
      const { userId, userType } = data;

      if (userType === "user") {
        await userModel.findByIdAndUpdate(userId, { socketId: socket.id });
        console.log(`✅ Updated user ${userId} with socketId: ${socket.id}`);
      } else if (userType === "captain") {
        await captainModel.findByIdAndUpdate(userId, {
          socketId: socket.id,
          status: "active", // Set status to active when the captain logs in
          isAvailable: true, // Mark the captain as available
        });
        console.log(`✅ Updated captain ${userId} with socketId: ${socket.id}, status: active, and isAvailable: true`);
      }
    });

    socket.on("update-location-captain", async (data) => {
      const { userId, location } = data;

      // Validate location data
      if (!location || typeof location.ltd !== "number" || typeof location.lng !== "number") {
        return socket.emit("error", { message: "Invalid location data" });
      }

      // Update captain's location in the database
      await captainModel.findByIdAndUpdate(userId, {
        location: {
          type: "Point",
          coordinates: [location.lng, location.ltd], // GeoJSON expects [lng, lat]
        },
      });

      console.log(`✅ Updated location for captain ${userId}:`, location);
    });

    socket.on("disconnect", async () => {
      console.log(`Client disconnected: ${socket.id}`);

      // Find the captain by socketId and set their status to inactive and isAvailable to false
      await captainModel.findOneAndUpdate(
        { socketId: socket.id },
        { status: "inactive", socketId: null, isAvailable: false } // Clear the socketId and mark as unavailable
      );
    });
  });
}

const sendMessageToSocketId = (socketId, messageObject) => {
  if (io) {
    console.log(
      `➡️ Emitting '${messageObject.event}' to socket: ${socketId}`,
      messageObject.data
    );
    io.to(socketId).emit(messageObject.event, messageObject.data);
  } else {
    console.log("❌ Socket.io not initialized.");
  }
};

module.exports = { initializeSocket, sendMessageToSocketId };
