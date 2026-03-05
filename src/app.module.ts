import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from './infrastructure/database/prisma.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './presentation/auth/auth.module';
import { ClientsModule } from './presentation/clients/clients.module';
import { CollectesModule } from './presentation/collectes/collectes.module';
import { CommandesModule } from './presentation/commandes/commandes.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 100,
    }]),
    PrismaModule,
    AuthModule,
    ClientsModule,
    CollectesModule,
    CommandesModule
    // Les modules Presentation seront ajoutés
    // au fur et à mesure
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
