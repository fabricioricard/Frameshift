import express from "express";
import multer from "multer";
import FormData from "form-data";
import fetch from "node-fetch";
import { verifyFirebaseToken } from "./_core/firebase";

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 500 * 1024 * 1024 }, // 500MB max
});

router.post("/api/upload/video", upload.single("file"), async (req, res) => {
  // Verify Firebase auth
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

  if (!req.file) {
    res.status(400).json({ error: "Nenhum arquivo enviado" });
    return;
  }

  const jwt = process.env.PINATA_JWT;
  if (!jwt) {
    res.status(500).json({ error: "Pinata não configurado" });
    return;
  }

  try {
    const title = (req.body.title as string) || req.file.originalname;

    // Upload to Pinata IPFS
    const formData = new FormData();
    formData.append("file", req.file.buffer, {
      filename: req.file.originalname,
      contentType: req.file.mimetype,
    });
    formData.append(
      "pinataMetadata",
      JSON.stringify({ name: title })
    );
    formData.append(
      "pinataOptions",
      JSON.stringify({ cidVersion: 1 })
    );

    const pinataRes = await fetch(
      "https://api.pinata.cloud/pinning/pinFileToIPFS",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${jwt}`,
          ...formData.getHeaders(),
        },
        body: formData,
      }
    );

    if (!pinataRes.ok) {
      const err = await pinataRes.text();
      console.error("[Pinata] Error:", err);
      res.status(502).json({ error: "Falha ao publicar no IPFS" });
      return;
    }

    const data = (await pinataRes.json()) as { IpfsHash: string };
    const ipfsHash = data.IpfsHash;

    // Return public gateway URL
    const url = `https://gateway.pinata.cloud/ipfs/${ipfsHash}`;
    res.json({ url, hash: ipfsHash });
  } catch (err) {
    console.error("[Upload] Error:", err);
    res.status(500).json({ error: "Erro interno no upload" });
  }
});

export default router;