import { NextApiRequest } from "next";
import { NextApiResponseServerIO, socketManager } from "@/lib/socket/server";

export default function handler(
  _req: NextApiRequest,
  res: NextApiResponseServerIO,
) {
  if (!res.socket.server.io) {
    console.log("Setting up Socket.IO server...");

    const io = socketManager.initialize(res.socket.server);
    res.socket.server.io = io;

    console.log("Socket.IO server initialized");
  } else {
    console.log("Socket.IO server already running");
  }

  res.end();
}

export const config = {
  api: {
    bodyParser: false,
  },
};
