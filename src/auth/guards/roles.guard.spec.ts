import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';
import { UserRole } from 'src/users/enums/users.enums';

describe('RolesGuard', () => {
  let rolesGuard: RolesGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    rolesGuard = new RolesGuard(reflector);
  });

  const MockContext = (user?: { role: UserRole }) => {
    const request = { user };

    return {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
      getHandler: () => ({}),
      getClass: () => ({}),
    };
  };

  it('Пользователь не авторизован', () => {
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue([UserRole.ADMIN]);

    const context = MockContext();
    const result = rolesGuard.canActivate(context as any);

    expect(result).toBe(false);
  });

  it('Роль пользователя совпадает', () => {
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue([UserRole.ADMIN]);

    const context = MockContext({ role: UserRole.ADMIN });
    const result = rolesGuard.canActivate(context as any);

    expect(result).toBe(true);
  });

  it('Роль пользователя не совпадает', () => {
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue([UserRole.ADMIN]);

    const context = MockContext({ role: UserRole.USER });
    const result = rolesGuard.canActivate(context as any);

    expect(result).toBe(false);
  });

  it('Роль не требуется', () => {
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue(undefined);

    const context = MockContext({ role: UserRole.USER });
    const result = rolesGuard.canActivate(context as any);

    expect(result).toBe(true);
  });
});
