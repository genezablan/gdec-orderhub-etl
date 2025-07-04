import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { AccessControlController } from './controllers/access-control.controller';
import { AccessControlService } from './services/access-control.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { AccessGuard } from './guards/access.guard';
import { DatabaseOrderhubModule } from '@app/database-orderhub';
import { APP_GUARD } from '@nestjs/core';

@Module({
  imports: [
    ConfigModule,
    DatabaseOrderhubModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET') || 'default-secret-key',
        signOptions: {
          expiresIn: '24h',
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController, AccessControlController],
  providers: [
    AuthService,
    AccessControlService,
    JwtStrategy,
    RolesGuard,
    AccessGuard,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: AccessGuard,
    },
  ],
  exports: [AuthService, AccessControlService, JwtModule, PassportModule, RolesGuard, AccessGuard],
})
export class AuthModule {}
