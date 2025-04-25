// src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config'; // Ensure ConfigService is imported
import { MongooseModule } from '@nestjs/mongoose'; // Import MongooseModule
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { UsersService } from './users/users.service';
import { OrdersModule } from './orders/orders.module';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { WebhooksModule } from './webhooks/webhooks.module';
import { WebhooksService } from './webhooks.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    MongooseModule.forRootAsync({ // Configure Mongoose asynchronously
      imports: [ConfigModule], // Make ConfigModule available within this factory
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('MONGO_URI'), // Get URI from .env
        // Optional: Add other Mongoose connection options if needed
        // useNewUrlParser: true, // Generally default in recent Mongoose versions
        // useUnifiedTopology: true, // Generally default in recent Mongoose versions
      }),
      inject: [ConfigService], // Inject ConfigService into the factory
    }),
    UsersModule,
    OrdersModule,
    WebhooksModule,
    // Other modules will be added here later
  ],
  controllers: [AppController, OrdersController],
  providers: [AppService, UsersService, OrdersService, WebhooksService],
})
export class AppModule {}