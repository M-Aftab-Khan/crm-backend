import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { LoginUserDto, RegisterUserDto } from './auth.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly jwtService: JwtService,
    ) {}

    async registerUser(registerUserDto: RegisterUserDto){
        const  {password, ...data} = registerUserDto;
        const hashedPassword = await bcrypt.hash(password, 10);
        return this.prisma.user.create({
            data:{
                ...data,
                password: hashedPassword
            }
        });
    }

    async loginUser(loginUserDto: LoginUserDto){
        const user = await this.prisma.user.findUnique({
            where: {
                email: loginUserDto.email
            }
        });
        if(!user){
            throw new UnauthorizedException('Invalid credentials');
        }
        const isPasswordValid = await bcrypt.compare(loginUserDto.password, user.password);
        if(!isPasswordValid){
            throw new UnauthorizedException('Invalid credentials');
        }
        const payload = {
            sub: user.id,
            email: user.email
        };
        return {
            access_token: this.jwtService.sign(payload)
        };
    }
}
