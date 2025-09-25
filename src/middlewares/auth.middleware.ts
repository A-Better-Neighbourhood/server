/** @format */

import { RequestHandler } from "express";
import { verifyToken, extractTokenFromHeader } from "../utils/jwt";
import { authService } from "../services/auth.service";

export const authMiddleware: RequestHandler = async (req, res, next) => {
  try {
    const authHeader = req.cookies.token || req.headers.authorization;
    console.log(req.cookies.token);
    const token = authHeader;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Access token is required",
      });
    }

    const payload = verifyToken(token);

    console.log(payload);

    if (!payload) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired token",
      });
    }

    // Get user information and attach to request
    const user = await authService.getUserById(payload.userId);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found",
      });
    }

    console.log(user);

    req.user = {
      id: user.id,
      contactNo: user.contactNo,
      fullName: user.fullName,
      address: user.address,
    };

    next();
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const optionalAuthMiddleware: RequestHandler = async (
  req,
  res,
  next
) => {
  try {
    const authHeader = req.headers.authorization;
    const token = extractTokenFromHeader(authHeader);

    if (token) {
      const payload = verifyToken(token);
      if (payload) {
        const user = await authService.getUserById(payload.userId);
        if (user) {
          req.user = {
            id: user.id,
            contactNo: user.contactNo,
            fullName: user.fullName,
            address: user.address,
          };
        }
      }
    }

    next();
  } catch (error) {
    // For optional auth, we continue even if there's an error
    next();
  }
};
