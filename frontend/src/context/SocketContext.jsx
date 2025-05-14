// import React, { createContext, useEffect, useState } from "react";
// import { io } from "socket.io-client";

// export const SocketContext = createContext();

// const SocketProvider = ({ children }) => {
//   const [socket, setSocket] = useState(null);

//   useEffect(() => {
//     const newSocket = io(import.meta.env.VITE_BASE_URL, {
//       transports: ["websocket"],
//       reconnection: true,
//       reconnectionAttempts: 5,
//       reconnectionDelay: 1000,
//     });

//     setSocket(newSocket);

//     newSocket.on("connect", () => {
//       console.log("✅ Connected to socket:", newSocket.id);
//     });

//     newSocket.on("disconnect", () => {
//       console.log("❌ Disconnected from socket");
//     });

//     // Optional: Debugging — log all events
//     newSocket.onAny((event, ...args) => {
//       console.log(`📩 [Socket] Event received: ${event}`, args);
//     });

//     return () => {
//       newSocket.disconnect();
//     };
//   }, []);

//   const joinSocket = ({ userId, userType }) => {
//     if (socket) {
//       socket.emit("join", { userId, userType });
//       console.log("🧑‍✈️ Emitted 'join' with:", { userId, userType });
//     }
//   };

//   const updateCaptainLocation = ({ userId, latitude, longitude }) => {
//     if (socket) {
//       socket.emit("update-location-captain", {
//         userId,
//         location: {
//           lat: latitude, // Changed from "ltd" to "lat"
//           lng: longitude,
//         },
//       });
//       console.log("📍 Emitted 'update-location-captain' with:", {
//         userId,
//         location: {
//           lat: latitude,
//           lng: longitude,
//         },
//       });
//     }
//   };

//   return (
//     <SocketContext.Provider
//       value={{
//         socket,
//         joinSocket,
//         updateCaptainLocation,
//       }}
//     >
//       {children}
//     </SocketContext.Provider>
//   );
// };

// export default SocketProvider;

import React, { createContext, useEffect } from "react";
import { io } from "socket.io-client";

export const SocketContext = createContext();

const socket = io(`${import.meta.env.VITE_BASE_URL}`); // Replace with your server URL

const SocketProvider = ({ children }) => {
  useEffect(() => {
    // Basic connection logic
    socket.on("connect", () => {
      console.log("Connected to server");
    });

    socket.on("disconnect", () => {
      console.log("Disconnected from server");
    });
  }, []);

  return (
    <SocketContext.Provider value={{ socket }}>
      {children}
    </SocketContext.Provider>
  );
};

export default SocketProvider;
