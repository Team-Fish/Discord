import { Injectable, BadRequestException } from "@nestjs/common";
import { CreateUserDto } from "src/user/dtos/createUser.dto";
import { UserService } from "src/user/user.service";
import { ConfigService } from "@nestjs/config";
import { MailgunService } from "src/mailgun/mailgun.service";
import { User } from "@prisma/client";
import { v4 as uuid } from "uuid";
import IoRedis, { Redis } from "ioredis";
import * as argon from "argon2";

@Injectable()
export class AuthService {
  private redis: Redis;

  constructor(
    private userService: UserService,
    private config: ConfigService,
    private mailgun: MailgunService,
  ) {
    this.redis = new IoRedis("redis://localhost:6379");
  }

  async register(dto: CreateUserDto) {
    return await this.userService.createUser(dto);
  }

  async sendEmailVerification(user: Partial<User>) {
    const { emailVerified } = await this.userService.findUserByEmail(
      user.email,
    );

    if (emailVerified) {
      throw new BadRequestException({
        token: "Email verified already",
      });
    }

    const prefix = this.config.get("FORGET_PASSWORD_PREFIX");

    const token = uuid();

    await this.redis.set(
      prefix + token,
      user.id,
      "EX",
      1000 * 60 * 60 * 24 * 3,
    ); // 3 days

    this.mailgun.sendEmailVerification(user, token);
  }

  async verifyEmail(token: string) {
    const key = this.config.get("FORGET_PASSWORD_PREFIX") + token;

    const userId = await this.redis.get(key);

    if (!userId)
      throw new BadRequestException({
        token: "Token invalid or expired",
      });

    await this.userService.updateUserEmailVerify(userId);

    await this.redis.del(key);
  }

  async validateUser(email: string, password: string) {
    const user = await this.userService.findUserByEmail(email);

    if (!user)
      throw new BadRequestException({
        email: "Email or password is invalid",
        password: "Email or password is invalid",
      });

    const isMatch = await argon.verify(user.password, password);

    if (!isMatch)
      throw new BadRequestException({
        email: "Email or password is invalid",
        password: "Email or password is invalid",
      });

    delete user.password;

    return user;
  }
}
