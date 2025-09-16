/** @format */
import admin from "firebase-admin";
import pool from "../lib/db.js";

export class AuthService {
  async signUp(
    idToken: string,
    userDetails: { userName: string; address: string }
  ) {
    //Whole Sign In Procedure
    const decoded = await admin.auth().verifyIdToken(idToken);

    const { uid, phone_number } = decoded;

    const result = await pool.query(
      `INSERT INTO user (uid,phone,userName , address)
      VALUES ($1 , $2 , $3 , $4) RETURNING *`,
      [uid, phone_number, userDetails.userName, userDetails.address]
    );
    return result.rows[0];
  }

  async signIn(idToken: string) {
    const decoded = await admin.auth().verifyIdToken(idToken);
    const { uid } = decoded;

    const result = await pool.query(`SELECT * FROM "user" WHERE uid = $1`, [
      uid,
    ]);

    if (result.rows.length === 0) {
      throw new Error("User not found. Please sign up first.");
    }
    return result.rows[0];
  }

  async signOut(idToken: string) {
    try {
      const decodedToken = await admin.auth().verifyIdToken(idToken);
      const uid = decodedToken.uid;

      await admin.auth().revokeRefreshTokens(uid);
    } catch (error) {
      console.error("Error revoking refresh token:", error);
      throw new Error("Failed to sign out.");
    }
  }
}

export const authService = new AuthService();
