import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';
import { UserRole } from 'src/users/enums/users.enums';
import { ExecutionContext } from '@nestjs/common';

describe('RolesGuard', () => {
  let rolesGuard: RolesGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    rolesGuard = new RolesGuard(reflector);
  });

  class MockClass {}
  const mockHandler = () => {};

  const MockContext = (user?: { role: UserRole }) => {
    const userPayload = user
      ? {
          sub: 'mock-sub',
          email: 'mock@example.com',
          ...user,
        }
      : undefined;

    const request = {
      user: userPayload,
    };

    return {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
      getHandler: () => mockHandler,
      getClass: () => MockClass,
      getArgs: () => [],
      getArgByIndex: () => undefined,
      switchToRpc: () => ({}),
      switchToWs: () => ({}),
      getType: () => 'http',
    } as unknown as ExecutionContext;
  };

  it('Пользователь не авторизован (user отсутствует)', () => {
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue([UserRole.ADMIN]);

    const context = MockContext();
    const result = rolesGuard.canActivate(context);

    expect(result).toBe(false);
  });

  it('Роль пользователя совпадает', () => {
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue([UserRole.ADMIN]);

    const context = MockContext({ role: UserRole.ADMIN });
    const result = rolesGuard.canActivate(context);

    expect(result).toBe(true);
  });

  it('Роль пользователя не совпадает', () => {
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue([UserRole.ADMIN]);

    const context = MockContext({ role: UserRole.USER });
    const result = rolesGuard.canActivate(context);

    expect(result).toBe(false);
  });

  it('Роль не требуется', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);

    const context = MockContext({ role: UserRole.USER });
    const result = rolesGuard.canActivate(context);

    expect(result).toBe(true);
  });
});
