import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { UserService } from './user.service';
import { AuthGuard } from '../auth/auth.guard';
import type { Request } from 'express';
import { SearchUserDto, UpdateUserDto } from './user.dto';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  //get my profile
  @UseGuards(AuthGuard)
  @Get('me')
  async getMyProfile(@Req() request: Request) {
    return this.userService.getMyProfile((request as any).user.sub);
  }

  //get all users(admin only)
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('admin')
  @Get()
  async getAllUsers(@Req() request: Request) {
    return this.userService.getAllUsers((request as any).user.sub);
  }

  //search user by email (admin only)
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('admin')
  @Get('search')
  async searchUserByEmail(
    @Query() searchUserDto: SearchUserDto,
    @Req() request: Request,
  ) {
    return this.userService.searchUserByEmail(
      searchUserDto.email,
      (request as any).user.sub,
    );
  }

  //update user by id (admin/me only)
  @UseGuards(AuthGuard)
  @Patch(':id')
  async updateUserById(
    @Param('id') userId: string,
    @Body() updateUserDto: UpdateUserDto,
    @Req() request: Request,
  ) {
    return this.userService.updateUserById(
      userId,
      (request as any).user.sub,
      updateUserDto,
    );
  }

  //delete user (admin/me only)
  @UseGuards(AuthGuard)
  @Delete(':id')
  async deleteUserById(@Param('id') userId: string, @Req() request: Request) {
    return this.userService.deleteUserById(userId, (request as any).user.sub);
  }
}
