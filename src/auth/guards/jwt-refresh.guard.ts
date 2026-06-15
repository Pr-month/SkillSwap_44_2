import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtRefreshGuard extends AuthGuard('jwt-refresh') {
  /**
   * Этот гард — обёртка над встроенным AuthGuard из @nestjs/passport.
   * Он активирует стратегию аутентификации с именем 'jwt-refresh',
   * которую мы определили в JwtRefreshStrategy (там было: extends PassportStrategy(Strategy, 'jwt-refresh')).
   *
   * Что происходит при срабатывании гарда:
   * 1. Passport находит стратегию 'jwt-refresh'.
   * 2. Стратегия извлекает refresh-токен из куки 'refresh_token'.
   * 3. Проверяет подпись токена через refreshSecret и срок действия.
   * 4. Если токен валиден — вызывает метод validate() в стратегии,
   *    кладёт результат в req.user и пропускает запрос дальше.
   * 5. Если токен невалиден — сразу возвращает 401 Unauthorized.
   *
   * Зачем отдельный класс (а не @UseGuards(AuthGuard('jwt-refresh'))):
   * - Читаемость: в контроллере видно явное имя JwtRefreshGuard.
   * - Единый источник истины: имя стратегии вынесено в одно место.
   * - Возможность расширения: сюда потом можно добавить доп. логику
   *   (логирование, проверку ролей и т. п.), переопределив методы CanActivate и др.
   *
   * Где используется:
   *   @UseGuards(JwtRefreshGuard) на эндпоинте POST /auth/refresh,
   *   который выдаёт новый access-токен по валидному refresh-токену.
   */
}
