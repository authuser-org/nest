import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { UsersController } from './users/users.controller.js';
import { UsersService } from './users/users.service.js';

@Module({
  controllers: [AppController, UsersController],
  providers: [UsersService],
})
export class AppModule {}
