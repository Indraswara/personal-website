import { prisma } from "../prisma";
import { sign } from "jsonwebtoken";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import { error } from "console";
import { Request, response, Response } from "express";
import responseAPI from "../utils/responseAPI";

dotenv.config();

const secret = process.env.JWT_SECRET;

const validateEmail = (email: string) => {
  return String(email)
    .toLowerCase()
    .match(
      /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
    );
};

const passwordChecker = (password: string) => {
  //buat password mengandung satu huruf besar, satu angka, dan satu karakter spesial
  const passwordRegex = /^(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9])/;
  return passwordRegex.test(password);
};

export const AuthController = {
  signup: async (req: any, res: any) => {
    const { username, email, name, password, confirmPassword } = req.body;
    if (!username || !email || !password || !name || !confirmPassword) {
      const message = "All fields are required";
      responseAPI(res, 400, false, message);
      return;
    } else if (password !== confirmPassword) {
      const message = "Password and confirm password must be the same";
      responseAPI(res, 400, false, message);
      return;
    } else if (!validateEmail(email)) {
      const message = "Invalid email";
      responseAPI(res, 400, false, message);
      return;
    } else if (password.length < 6) {
      const message = "Password must be at least 6 characters long";
      responseAPI(res, 400, false, message);
      return;
    } else if (!passwordChecker(password)) {
      const message = "Password must contain one uppercase letter, one number, and one special character";
      responseAPI(res, 400, false, message);
      return;
    }

    try {
      // check email dalam db
      const isExistUser = await prisma.user.findUnique({
        where: {
          email: email,
        },
      });

      if (isExistUser) {
        const message = "Email already exists";
        responseAPI(res, 400, false, message);
        return;
      }

      var salt = bcrypt.genSaltSync(10);
      var hashed_password = bcrypt.hashSync(password, salt);

      const currDatetime = new Date();
      const newUser = await prisma.user.create({
        data: {
          username: username,
          email: email,
          password_hash: hashed_password,
          full_name: name,
          created_at: currDatetime,
          updated_at: currDatetime,
        },
      });
      if (newUser) {
        const message = "User created successfully";
        responseAPI(res, 201, true, message);
        return;
      } else {
        const message = "User failed to create";
        responseAPI(res, 500, false, message);
      }
    } catch (error) {
      const message = "Internal server error";
      responseAPI(res, 500, false, message);
      return;
    }
  },

  signin: async (req: any, res: any) => {
    const { identifier, password } = req.body;
    if (!identifier || !password) {
      responseAPI(res, 400, false, "All fields are required");
      return;
    }

    try {
      
      const userwithusername = await prisma.user.findUnique({
        where: {
          username: identifier,
        },
      })
      let user = null;
      if(userwithusername){
        user = userwithusername;
      }
      else{
        user = await prisma.user.findUnique({
          where: {
            email: identifier,
          },
        });
      }

      if (!user) {
        responseAPI(res, 400, false, "Email or Password is wrong", {token: null});
        return;
      }
      const isPasswordvalid = bcrypt.compareSync(password, user.password_hash);
      if (!isPasswordvalid) {
        responseAPI(res, 400, false, "Email or Password is wrong", {token: null});
        return;
      }
      if (!secret) {
        throw new Error("JWT_SECRET is not defined in environment variables");
      }

      const token = sign(
        {
          id: user.id.toString(),
          email: user.email,
          username: user.username,
          fullname: user.full_name,
          // Not password_hash: a JWT is signed, not encrypted — anyone
          // holding the token can read its payload, and nothing downstream
          // ever reads this field back out of it anyway.
        },
        secret,
        { expiresIn: "1h" }
      );

      if (token) {
        res.cookie("authToken", token, {
          // httpOnly: true,
          // sameSite: "strict",
          expires: new Date(Date.now() + 3600000),
          // secure: true,
        });

        responseAPI(res, 200, true, "Login successful", { token: token });
        return;
      } else {
        responseAPI(res, 500, false, "Can't login user at the moment", { token: null });
        return;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      responseAPI(res, 500, false, errorMessage, { token: null });
      return;
    }
  },

  
  logout: async (req: any, res: any) => {
    try {
      const token = req.cookies.authToken;
      if (!token) {
        responseAPI(res, 400, false, "You are not logged in");
      } else {
        res.clearCookie("authToken");
        responseAPI(res, 200, true, "Logout success");
        return;
      }
    } catch (err) {
      responseAPI(res, 500, false, "Internal server error");
      return;
    }
  },


  getUser: async (req: any, res: any) => {
    try {
      const user = req.user;
      responseAPI(res, 200, true, "User data fetched successfully", user);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      responseAPI(res, 500, false, errorMessage, { token: null });
    }
  },

  getUserById: async (req: any, res: any) => {
    try {
      const userId = req.params.id;
      const user = await prisma.user.findUnique({
        select: {
          id: true,
          username: true,
          email: true,
          full_name: true,
        },
        where: {
          id: Number(userId),
        },
      });

      if (!user) {
        responseAPI(res, 404, false, "User not found", null);
        return;
      }

      const payloadUser = {
        id: user.id.toString(),
        username: user.username,
        email: user.email,
        full_name: user.full_name,
      };

      responseAPI(res, 200, true, "User data fetched successfully", payloadUser);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      responseAPI(res, 500, false, errorMessage, {token: null});
    }
  },
  //debugging
  test: async (req: any, res: any) => {
    try {
      const users = await prisma.user.findMany();

      const payloadUser = users.map((user: any) => ({
        id: user.id.toString(),
        username: user.username,
        email: user.email,
        full_name: user.full_name,
      }));

      res
        .status(200)
        .json({ status: true, message: "Test success", body: req.user });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      res.status(500).json({
        status: true,
        message: errorMessage,
        body: {
          token: null,
        },
      });
    }
  },
};
