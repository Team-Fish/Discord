import {
  Controller,
  Post,
  Body,
  HttpCode,
  UseGuards,
  Session as GetSession,
  Get,
  UseFilters,
  Res,
} from "@nestjs/common";
import { User } from "@prisma/client";
import { Session } from "express-session";
import { GetUser } from "src/utils/decorators";
import { AuthService } from "./auth.service";
import { CreateUserDto } from "src/user/dtos/createUser.dto";
import { SignInDto } from "./dtos/signIn.dto";
import { LocalGuard, AuthenticatedGuard } from "./utils/guards";
import { HttpExceptionFilter } from "src/utils/exceptions/http-exception.filter";
import { Response } from "express";
import { VerifyEmailDto } from "./dtos/verify-email.dto";

@Controller("auth")
export class AuthController {
  constructor(private authService: AuthService) {}

  @UseFilters(HttpExceptionFilter)
  @Post("register")
  async register(@Body() dto: CreateUserDto, @GetSession() session) {
    const user = await this.authService.register(dto);

    session.passport = {
      user: user.id,
    };

    await this.authService.sendEmailVerification(user);

    return user;
  }

  @UseFilters(HttpExceptionFilter)
  @Post("email/verify")
  async verifyEmail(@Body() dto: VerifyEmailDto) {
    const { token } = dto;

    await this.authService.verifyEmail(token);

    return {
      message: "OK",
    };
  }

  @UseFilters(HttpExceptionFilter)
  @UseGuards(AuthenticatedGuard)
  @Post("email/resend")
  async resendEmail(@GetUser() user: User) {
    await this.authService.sendEmailVerification(user);
    return {
      message: "OK",
    };
  }

  @UseGuards(AuthenticatedGuard)
  @Get("logout")
  @HttpCode(204)
  logout(@Res() res: Response, @GetSession() session: Session) {
    session.destroy((err) => {
      res.clearCookie("connect.sid");
      res.status(204).send();
    });
  }

  @UseGuards(AuthenticatedGuard)
  @Get("me")
  getMe(@GetUser() user: User) {
    return user;
  }

  @UseGuards(LocalGuard)
  @UseFilters(HttpExceptionFilter)
  @HttpCode(200)
  @Post("login")
  login(@Body() dto: SignInDto, @GetUser() user: User) {
    return user;
  }
}
