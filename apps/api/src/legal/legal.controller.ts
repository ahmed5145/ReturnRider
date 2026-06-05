import { Controller, Get, Res } from '@nestjs/common';
import { Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';

@Controller('legal')
export class LegalController {
  private readLegal(filename: string): string {
    const candidates = [
      path.join(__dirname, '..', '..', '..', '..', 'legal', filename),
      path.join(process.cwd(), '..', '..', 'legal', filename),
      path.join(process.cwd(), 'legal', filename),
    ];
    for (const filePath of candidates) {
      if (fs.existsSync(filePath)) {
        return fs.readFileSync(filePath, 'utf8');
      }
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
