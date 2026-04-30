import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateUserDto } from './user.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  async getMyProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.sanitizeUser(user);
  }

  async getAllUsers(requesterId: string) {
    await this.ensureAdmin(requesterId);

    const users = await this.prisma.user.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });

    return users.map((user) => this.sanitizeUser(user));
  }

  async searchUserByEmail(email: string, requesterId: string) {
    await this.ensureAdmin(requesterId);

    const users = await this.prisma.user.findMany({
      where: {
        email: {
          contains: email,
          mode: 'insensitive',
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return users.map((user) => this.sanitizeUser(user));
  }

  async updateUserById(
    targetUserId: string,
    requesterId: string,
    updateUserDto: UpdateUserDto,
  ) {
    await this.ensureAdminOrOwner(requesterId, targetUserId);
    if (updateUserDto.role && requesterId === targetUserId) {
      throw new ForbiddenException('Only admins can change role');
    }

    const data: Record<string, unknown> = { ...updateUserDto };

    if (updateUserDto.password) {
      data.password = await bcrypt.hash(updateUserDto.password, 10);
    }

    try {
      const updatedUser = await this.prisma.user.update({
        where: {
          id: targetUserId,
        },
        data,
      });
      return this.sanitizeUser(updatedUser);
    } catch {
      throw new NotFoundException('User not found');
    }
  }

  async deleteUserById(targetUserId: string, requesterId: string) {
    await this.ensureAdminOrOwner(requesterId, targetUserId);

    try {
      const deletedUser = await this.prisma.user.delete({
        where: {
          id: targetUserId,
        },
      });
      return this.sanitizeUser(deletedUser);
    } catch {
      throw new NotFoundException('User not found');
    }
  }

  private async ensureAdmin(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        role: true,
      },
    });

    if (!user) {
      throw new NotFoundException('Requester not found');
    }

    if (user.role !== 'admin') {
      throw new ForbiddenException('Admin access required');
    }
  }

  private async ensureAdminOrOwner(requesterId: string, targetUserId: string) {
    if (requesterId === targetUserId) {
      return;
    }

    await this.ensureAdmin(requesterId);
  }

  private sanitizeUser(user: Record<string, unknown>) {
    const { password, ...safeUser } = user;
    return safeUser;
  }
}

