import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { CreateUserDto } from './create-user.dto.js';
import { type User, UsersService } from './users.service.js';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get()
  @ApiOperation({ summary: 'List users' })
  @ApiOkResponse({ description: 'Current in-memory users.' })
  findAll(): readonly User[] {
    return this.users.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get one user' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiOkResponse({ description: 'User found.' })
  @ApiNotFoundResponse({ description: 'User not found.' })
  findOne(@Param('id', ParseIntPipe) id: number): User {
    return this.users.findOne(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a user' })
  @ApiCreatedResponse({ description: 'User created.' })
  @ApiBadRequestResponse({ description: 'DTO validation failed.' })
  @ApiConflictResponse({ description: 'Email already exists.' })
  create(@Body() input: CreateUserDto): User {
    return this.users.create(input);
  }
}
