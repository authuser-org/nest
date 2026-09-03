import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Header,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  QueryMethod,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiExcludeEndpoint,
  ApiNotFoundResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { CreateUserDto } from './create-user.dto.js';
import { QueryUsersDto } from './query-users.dto.js';
import { type User, UsersService } from './users.service.js';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get()
  @ApiOperation({ summary: 'List users' })
  @ApiOkResponse({ description: 'Current in-memory users.' })
  @ApiQuery({ name: 'email', required: false, example: 'ada@example.com' })
  findAll(@Query('email') email?: string): readonly User[] {
    return this.users.findAll(email);
  }

  @QueryMethod('search')
  @Header('Accept-Query', 'application/json')
  @ApiExcludeEndpoint()
  search(@Body() input: QueryUsersDto): readonly User[] {
    return this.users.findAll(input.email);
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

  @Put(':id')
  @ApiOperation({ summary: 'Replace a user' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiOkResponse({ description: 'User replaced.' })
  @ApiBadRequestResponse({ description: 'DTO validation failed.' })
  @ApiNotFoundResponse({ description: 'User not found.' })
  @ApiConflictResponse({ description: 'Email already exists.' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() input: CreateUserDto,
  ): User {
    return this.users.update(id, input);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a user' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiNoContentResponse({ description: 'User deleted.' })
  @ApiNotFoundResponse({ description: 'User not found.' })
  remove(@Param('id', ParseIntPipe) id: number): void {
    this.users.remove(id);
  }
}
