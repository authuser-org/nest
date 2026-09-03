import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import type { CreateUserDto } from './create-user.dto.js';

export interface User {
  id: number;
  name: string;
  email: string;
}

@Injectable()
export class UsersService {
  private readonly users: User[] = [
    { id: 1, name: 'Ada Lovelace', email: 'ada@example.com' },
  ];
  private nextId = 2;

  findAll(): readonly User[] {
    return this.users;
  }

  findOne(id: number): User {
    const user = this.users.find((candidate) => candidate.id === id);
    if (!user) throw new NotFoundException(`User ${id} was not found`);
    return user;
  }

  create(input: CreateUserDto): User {
    const normalizedEmail = input.email.trim().toLowerCase();
    if (this.users.some((user) => user.email === normalizedEmail)) {
      throw new ConflictException('Email already exists');
    }

    const user: User = {
      id: this.nextId++,
      name: input.name.trim(),
      email: normalizedEmail,
    };
    this.users.push(user);
    return user;
  }
}
