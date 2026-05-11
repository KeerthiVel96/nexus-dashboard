import admin from "firebase-admin";
import dotenv from "dotenv";
dotenv.config();

// Initialise once
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId:   process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey:  process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    }),
  });
}

export const verifyToken = async (req, res, next) => {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "No token provided" });
  }
  try {
    const token = header.split("Bearer ")[1];
    req.user = await admin.auth().verifyIdToken(token);
    next();
  } catch {
    return res.status(403).json({ error: "Invalid or expired token" });
  }
};