import net from "net";

const SERVERS = [
  { id: "server1", port: 8080, address: "server1" },
  { id: "server2", port: 8089, address: "server2" },
];

const CURRENT_SERVER = SERVERS[1];
const REPLICA_SERVER = SERVERS[0]

const dataStore = new Map();

const server = net.createServer((clientSocket) => {
  console.log("New client connected.");

  clientSocket.on("data", async (data) => {
    const request = JSON.parse(data.toString());

    try {
      if (request.type === "get") {
        handleGetRequest(clientSocket, request.key);
      } else if (request.type === "set") {
        await handleSetRequest(clientSocket, request.key, request.value);
      } else if (request.type === "sync-request") {
        handleSyncRequest(clientSocket);
      } else {
        clientSocket.write(JSON.stringify({ error: "Invalid request type" }) + "\n");
      }
    } catch (error) {
      clientSocket.write(JSON.stringify({ error: error.message }) + "\n");
    }
  });

  clientSocket.on("end", () => {
    console.log("Client disconnected.");
  });
});

server.listen(CURRENT_SERVER.port, async () => {
  console.log(`Server ${CURRENT_SERVER.id} is listening on port ${CURRENT_SERVER.port}`);

  try {
    await synchronizeWithReplica();
    console.log("Synchronization with replica completed successfully.");
  } catch (error) {
    console.error("Failed to synchronize with replica:", error.message);
  }
});

function handleGetRequest(socket, key) {
  const value = dataStore.get(key);
  socket.write(JSON.stringify({ key, value }) + "\n");
}

async function handleSetRequest(socket, key, value) {
  dataStore.set(key, value);

  try {
    await sendToReplica({
      type: "set",
      key,
      value,
    });
    socket.write(JSON.stringify({ success: true }) + "\n");
  } catch (error) {
    console.error("Failed to replicate data:", error.message);
    socket.write(
      JSON.stringify({ warning: "Data is not replicated due to replica unavailability" }) + "\n"
    );
  }
}

function handleSyncRequest(socket) {
  const syncData = Array.from(dataStore.entries()).map(([key, value]) => ({ key, value }));
  socket.write(JSON.stringify({ type: "sync-data", data: syncData }) + "\n");
}

async function synchronizeWithReplica() {
  return new Promise((resolve, reject) => {
    const replicaSocket = net.connect(REPLICA_SERVER.port, REPLICA_SERVER.address, () => {
      replicaSocket.write(JSON.stringify({ type: "sync-request" }) + "\n");
    });

    replicaSocket.on("data", (data) => {
      const response = JSON.parse(data.toString());
      if (response.type === "sync-data") {
        response.data.forEach(({ key, value }) => {
          dataStore.set(key, value);
        });
        replicaSocket.end();
        resolve();
      } else {
        reject(new Error("Invalid sync response"));
      }
    });

    replicaSocket.on("error", (err) => {
      reject(err);
    });
  });
}

function sendToReplica(request) {
  return new Promise((resolve, reject) => {
    const replicaSocket = net.connect(REPLICA_SERVER.port, REPLICA_SERVER.address, () => {
      replicaSocket.write(JSON.stringify(request) + "\n");
    });

    replicaSocket.on("data", (data) => {
      const response = JSON.parse(data.toString());
      replicaSocket.end();
      resolve(response);
    });

    replicaSocket.on("error", (err) => {
      reject(err);
    });
  });
}