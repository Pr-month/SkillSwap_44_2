import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from 'passport-jwt'
import { UsersService } from "src/users/users.service";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private configService: ConfigService, private usersService: UsersService ){
    const secret = configService.get<string>('JWT_ACCESS_SECRET', 'your_access_secret_key');

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret
    });
  }

    async validate(jwtPayload: {sub: number}){
      const user = await this.usersService.findOne(jwtPayload.sub);
      if (!user) {
      throw new UnauthorizedException('Пользователь не найден');
    }
      return user
    }
  }