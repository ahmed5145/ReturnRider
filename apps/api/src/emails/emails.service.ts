import {
  ConflictException,
  Injectable,
  BadRequestException,
} from '@nestjs/common';
import { EmailProvider } from '@prisma/client';
import { CryptoService } from '../common/crypto.service';
import { PrismaService } from '../prisma/prisma.service';
import { EmailConnectDto } from './dto/email-connect.dto';
import { EmailSyncService } from './email-sync.service';
import { GMAIL_READONLY_SCOPE, GmailService } from './gmail.service';

@Injectable()
export class EmailsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly crypto: CryptoService,
    private readonly gmail: GmailService,
    private readonly emailSync: EmailSyncService,
  ) {}

  async connect(userId: string, dto: EmailConnectDto) {
    if (dto.provider !== 'gmail') {
      throw new BadRequestException(`Provider ${dto.provider} not yet supported in API; use email-worker`);
    }

    const tokens = await this.gmail.exchangeCode(
      dto.authorization_code,
      dto.redirect_uri,
      dto.code_verifier,
    );

    const emailAddress =
      dto.email_hint ?? (await this.gmail.getProfileEmail(tokens.refresh_token!));

    const existing = await this.prisma.linkedEmail.findFirst({
      where: { emailAddress, NOT: { userId } },
    });
    if (existing) {
      throw new ConflictException('Email already linked to another user');
    }

    const { ciphertext, keyId } = this.crypto.encrypt(tokens.refresh_token!);

    const linked = await this.prisma.linkedEmail.upsert({
      where: {
        userId_emailAddress: { userId, emailAddress },
      },
      create: {
        userId,
        provider: EmailProvider.gmail,
        emailAddress,
        status: 'connected',
        oauthRefreshEnc: ciphertext,
        oauthRefreshKeyId: keyId,
        scopesGranted: [GMAIL_READONLY_SCOPE, 'openid', 'email'],
      },
      update: {
        oauthRefreshEnc: ciphertext,
        oauthRefreshKeyId: keyId,
        status: 'connected',
        scopesGranted: [GMAIL_READONLY_SCOPE, 'openid', 'email'],
      },
    });

    const job = await this.emailSync.enqueueSync(linked.id);

    return {
      linked_email_id: linked.id,
      email_address: emailAddress,
      provider: dto.provider,
      status: 'syncing' as const,
      sync_job_id: job.id ?? String(job.id),
      scopes_granted: linked.scopesGranted,
    };
  }
}
