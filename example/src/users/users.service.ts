import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import type { CreateUserDto } from './create-user.dto';

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

  findAll(email?: string): readonly User[] {
    if (!email) return this.users;
    const normalizedEmail = email.trim().toLowerCase();
    return this.users.filter((user) => user.email === normalizedEmail);
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

  update(id: number, input: CreateUserDto): User {
    const user = this.findOne(id);
    const normalizedEmail = input.email.trim().toLowerCase();
    if (this.users.some((candidate) => candidate.id !== id && candidate.email === normalizedEmail)) {
      throw new ConflictException('Email already exists');
    }
    user.name = input.name.trim();
    user.email = normalizedEmail;
    return user;
  }

  remove(id: number): void {
    const index = this.users.findIndex((candidate) => candidate.id === id);
    if (index === -1) throw new NotFoundException(`User ${id} was not found`);
    this.users.splice(index, 1);
  }
}
