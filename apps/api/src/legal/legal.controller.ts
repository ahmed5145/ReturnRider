import { Controller, Get, Res } from '@nestjs/common';
import { Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';

@Controller('legal')
export class LegalController {
  private readLegal(filename: string): string {
    const legalPath = path.join(__dirname, '..', '..', '..', '..', 'legal', filename);
    const altPath = path.join(process.cwd(), 'legal', filename);
    if (fs.existsSync(legalPath)) {
      return fs.readFileSync(legalPath, 'utf8');
    }
    if (fs.existsSync(altPath)) {
      return fs.readFileSync(altPath, 'utf8');
    }
    return 'Document not found.';
  }

  @Get('terms')
  getTerms(@Res() res: Response) {
    res.type('text/plain').send(this.readLegal('TERMS_OF_SERVICE.md'));
  }

  @Get('privacy')
  getPrivacy(@Res() res: Response) {
    res.type('text/plain').send(this.readLegal('PRIVACY_POLICY.md'));
  }
}
