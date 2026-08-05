const { io } = require("socket.io-client");

const socket = io("http://localhost:5000", {
  auth: {
    token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2YTczMDBmMzcxNzIxNjRiZjU0ZTVkY2EiLCJlbWFpbCI6ImthcnRoaWsxMkBnbWFpbC5jb20iLCJyb2xlIjoiQURNSU4iLCJpYXQiOjE3ODU5MjQ5NTgsImV4cCI6MTc4NTkyNTg1OH0.xEtDvWjxGkPO3aFleYizjVQjmxVM1j425xF7m-G6rDM",
  },
});

socket.on("connect", () => {
  console.log("✅ Connected");
});

socket.on("notification", (data) => {
  console.log("🔔 Notification Received");
  console.log(data);
});

socket.on("connect_error", (err) => {
  console.log("❌", err.message);
});