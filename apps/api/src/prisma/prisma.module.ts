import { Global, Module } from '@nestjs/common';
import { ParseBlocklistService } from '../parsers/parse-blocklist.service';
import { PrismaService } from './prisma.service';

@Global()
@Module({
  providers: [PrismaService, ParseBlocklistService],
  exports: [PrismaService, ParseBlocklistService],
})
export class PrismaModule {}
