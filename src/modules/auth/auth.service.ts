import { ApiError } from "../../utils/api-error";
import { JwtService } from "../jwt/jwt.service";
import { MailService } from "../mail/mail.service";
import { PasswordService } from "../password/password.services";
import { PrismaService } from "../prisma/prisma.service";
import { ForgotPasswordDTO } from "./dto/forgot-password.dto";
import { LoginDTO } from "./dto/login.dto";
import { RegisterDTO } from "./dto/register.dto";
import { ResetPasswordDTO } from "./dto/reset-password.dto";

export class AuthService {
  private prisma: PrismaService;
  private passwordService: PasswordService;
  private jwtService: JwtService;
  private mailService: MailService;
  constructor() {
    this.prisma = new PrismaService();
    this.passwordService = new PasswordService();
    this.jwtService = new JwtService();
    this.mailService = new MailService();
  }

  register = async (body: RegisterDTO) => {
    const user = await this.prisma.user.findFirst({
      where: {
        email: body.email,
      },
    });

    if (user) {
      throw new ApiError("User already exists", 400);
    }
    const hashedPassword = await this.passwordService.hashPassword(
      body.password
    );

    await this.mailService.sendMail(
      body.email, // kirim ke siapa
      "Thank you for registering!", // subject/ judul email
      "welcome", // nama files di folder mail/templates
      {
        name: body.name,
        year: new Date().getFullYear(),
      } // context -> data yang dimasukkan ke template emailnya
    );

    return await this.prisma.user.create({
      data: {
        name: body.name,
        email: body.email,
        password: hashedPassword,
      },
      omit: { password: true },
    });
  };

  login = async (body: LoginDTO) => {
    const user = await this.prisma.user.findFirst({
      where: { email: body.email },
    });

    if (!user) {
      throw new ApiError("Invalid credentials", 400);
    }

    const isPasswordValid = await this.passwordService.comparePassword(
      body.password,
      user.password
    );

    if (!isPasswordValid) {
      throw new ApiError("Invalid credentials", 400);
    }

    const payload = { id: user.id, role: user.role };

    const accessToken = this.jwtService.generateToken(
      payload,
      process.env.JWT_SECRET!,
      { expiresIn: "2h" }
    );

    const { password, ...userWithoutPassword } = user;

    return { ...userWithoutPassword, accessToken };
  };

  forgotPassword = async (body: ForgotPasswordDTO) => {
    const user = await this.prisma.user.findFirst({
      where: { email: body.email },
    });

    if (!user) {
      throw new ApiError("Invalid email address", 400);
    }

    const payload = { id: user.id };

    const token = this.jwtService.generateToken(
      payload,
      process.env.JWT_SECRET_RESET!,
      { expiresIn: "15m" }
    );

    const resetLink = `http://localhost:3000/reset-password/${token}`;
    await this.mailService.sendMail(
      body.email,
      "Reset Password",
      "forgot-password",
      {
        name: user.name,
        resetLink: resetLink,
        expireMinutes: "15",
        year: new Date().getFullYear(),
      }
    );

    return { message: "send email successfully" };
  };

  resetPassword = async (body: ResetPasswordDTO, authUserId: string) => {
    const user = await this.prisma.user.findFirst({
      where: { id: authUserId },
    });

    if (!user) {
      throw new ApiError("User not found", 400);
    }

    const hashedPassword = await this.passwordService.hashPassword(
      body.password
    );

    await this.prisma.user.update({
      where: { id: authUserId },
      data: { password: hashedPassword },
    });

    return { message: "reset password success" };
  };
}
