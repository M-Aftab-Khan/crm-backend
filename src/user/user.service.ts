import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UserService {
    constructor(private readonly prisma: PrismaService) {}
    async createUser(){
        return this.prisma.user.create({
            data:{
                fullName: "Test User",
                email: "test@test.com",
                password: "123456"
            }
        })
    }
}

