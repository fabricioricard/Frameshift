import { Router } from "express";
import { AccessToken } from "livekit-server-sdk";
import { verifyFirebaseToken } from "./_core/firebase";

const router = Router();

// Generate a token for a streamer or viewer to join a room
router.post("/api/livekit/token", async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Não autenticado" });
    return;
  }

  try {
    await verifyFirebaseToken(authHeader.slice(7));
  } catch {
    res.status(401).json({ error: "Token inválido" });
    return;
  }

  const { roomName, participantName, isHost } = req.body as {
    roomName: string;
    participantName: string;
    isHost: boolean;
  };

  if (!roomName || !participantName) {
    res.status(400).json({ error: "roomName e participantName são obrigatórios" });
    return;
  }

  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;

  if (!apiKey || !apiSecret) {
    res.status(500).json({ error: "LiveKit não configurado" });
    return;
  }

  const token = new AccessToken(apiKey, apiSecret, {
    identity: participantName,
    ttl: "4h",
  });

  token.addGrant({
    roomJoin: true,
    room: roomName,
    canPublish: isHost,      // only host can publish video/audio
    canSubscribe: true,      // everyone can watch
    canPublishData: true,    // everyone can send chat messages
  });

  res.json({ token: await token.toJwt() });
});

export default router;