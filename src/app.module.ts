import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { OrdersModule } from './orders/orders.module';
import { WebhooksModule } from './webhooks/webhooks.module'; // Import WebhooksModule

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('MONGO_URI'), // Change MONGODB_URI to MONGO_URI
      }),
      inject: [ConfigService],
    }),
    UsersModule,
    AuthModule,
    OrdersModule,
    WebhooksModule, // Add WebhooksModule here
  ],
  controllers: [], // Don't put WebhooksController here - it should be in WebhooksModule
  providers: [],
})
export class AppModule {}