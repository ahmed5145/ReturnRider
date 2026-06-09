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

  private sendHtml(res: Response, filename: string, title: string) {
    const text = this.readLegal(filename);
    const escaped = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    res.type('text/html').send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title} — ReturnRider</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; background: #0f1419; color: #f0f4f8; padding: 24px; line-height: 1.6; }
    pre { white-space: pre-wrap; word-wrap: break-word; font-size: 14px; }
    a { color: #3dd68c; }
  </style>
</head>
<body>
  <p><a href="/">← ReturnRider</a></p>
  <h1>${title}</h1>
  <pre>${escaped}</pre>
</body>
</html>`);
  }

  @Get('terms')
  getTerms(@Res() res: Response) {
    this.sendHtml(res, 'TERMS_OF_SERVICE.md', 'Terms of Service');
  }

  @Get('privacy')
  getPrivacy(@Res() res: Response) {
    this.sendHtml(res, 'PRIVACY_POLICY.md', 'Privacy Policy');
  }
}
