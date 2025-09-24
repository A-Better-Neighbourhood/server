/** @format */

import bcrypt from "bcryptjs";
import { PrismaClient } from "../generated/prisma/index";
import { generateToken, JwtPayload } from "../utils/jwt";

const prisma = new PrismaClient();

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    contactNo: string;
    fullName: string;
    address: string;
  };
}

export class AuthService {
  async signIn(phoneNumber: string, password: string): Promise<AuthResponse> {
    // Find user by phone number
    const user = await prisma.user.findUnique({
      where: { contactNo: phoneNumber },
    });

    if (!user) {
      throw new Error("Invalid phone number or password");
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new Error("Invalid phone number or password");
    }

    // Generate JWT token
    const tokenPayload: JwtPayload = {
      userId: user.id,
      contactNo: user.contactNo,
    };
    const token = generateToken(tokenPayload);

    return {
      token,
      user: {
        id: user.id,
        contactNo: user.contactNo,
        fullName: user.fullName,
        address: user.address,
      },
    };
  }

  async signUp(
    phoneNumber: string,
    password: string,
    name: string,
    address: string
  ): Promise<AuthResponse> {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { contactNo: phoneNumber },
    });

    if (existingUser) {
      throw new Error("User with this phone number already exists");
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        contactNo: phoneNumber,
        password: hashedPassword,
        fullName: name,
        address,
      },
    });

    // Generate JWT token
    const tokenPayload: JwtPayload = {
      userId: user.id,
      contactNo: user.contactNo,
    };
    const token = generateToken(tokenPayload);

    return {
      token,
      user: {
        id: user.id,
        contactNo: user.contactNo,
        fullName: user.fullName,
        address: user.address,
      },
    };
  }

  async getUserById(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        contactNo: true,
        fullName: true,
        address: true,
        createdAt: true,
      },
    });

    return user;
  }
}

export const authService = new AuthService();
