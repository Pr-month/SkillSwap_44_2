import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-jwt';
import { Request } from 'express';
import { ConfigService } from '@nestjs/config';
import type { TJwtConfig } from '../../config/jwt.config';
import type { JwtPayload } from '../auth.types';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  // Конструктор внедряет ConfigService для доступа к переменным окружения и конфигам
  constructor(private configService: ConfigService) {
    // Получаем типизированный конфиг JWT по ключу 'JWT_CONFIG'
    const jwtCfg = configService.get<TJwtConfig>('JWT_CONFIG');

    // Если конфиг не загружен (например, забыли добавить load: [jwtConfig] в AppModule) 
    if (!jwtCfg) {
      throw new Error(
        'JWT_CONFIG is undefined. Ensure that `load: [jwtConfig]` is added to ConfigModule.forRoot() in AppModule.',
      );
    }

    // Инициализируем базовую стратегию passport-jwt с нужными опциями
    super({
      // Извлекаем refresh-токен из HttpOnly-куки с именем 'refresh_token'.
      // Если куки нет, возвращаем null — тогда Passport отвергнет запрос (401).
      jwtFromRequest: (req: Request) => (req?.cookies?.['refresh_token'] as string) ?? null,
      // Используем отдельный секрет для refresh-токенов 
      secretOrKey: jwtCfg.refreshSecret,
      // Не игнорируем срок действия токена: истёкший refresh-токен будет отклонён
      ignoreExpiration: false,
      // Передаём объект запроса (req) в метод validate — нужно, чтобы перепроверить наличие куки и взять её значение
      passReqToCallback: true,
    });
  }

  /**
   * Метод validate вызывается ТОЛЬКО если подпись токена верна и срок действия не истёк.
   * Passport сам сделал тяжёлую работу (проверка подписи/exp), здесь мы лишь формируем итоговый объект пользователя
   * и делаем финальные проверки (например, что кука реально есть).
   *
   * @param req - объект запроса Express (нужен, чтобы достать refresh-токен из куки)
   * @param payload - уже проверенный (декодированный) payload токена (sub, email, role)
   * @returns объект пользователя, который попадёт в req.user
   */
  validate(
    req: Request,
    payload: JwtPayload,
  ): JwtPayload & { refreshToken: string } {
    // Ещё раз достаём refresh-токен из куки — страховка на случай рассинхрона
    const refreshToken = req.cookies?.['refresh_token'] as string | null;

    // Если куки вдруг нет (хотя Passport уже проверил токен), отвергаем запрос.    
    if (!refreshToken) throw new UnauthorizedException();

    // Возвращаем данные пользователя + сам refresh-токен.
    return {
      sub: payload.sub,       // ID пользователя (из payload)
      email: payload.email,   // Email (из payload)
      role: payload.role,     // Роль (из payload)
      refreshToken,           // Значение куки — передаём дальше в контроллер/сервис
    };
  }
}
