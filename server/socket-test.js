const { io } = require("socket.io-client");

const socket = io("http://localhost:5000", {
  auth: {
    token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2YTcwNWNmMjA2N2E4ZTQ2MDM4ZWZhNzQiLCJlbWFpbCI6ImthcnRoaWtAZ21haWwuY29tIiwicm9sZSI6IkFETUlOIiwiaWF0IjoxNzg1OTQ5MjM2LCJleHAiOjE3ODU5NTAxMzZ9.HIOlm1t3Bqx0c0ICuQgxrCgveCqrH29CpWhnLyolIz8",
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