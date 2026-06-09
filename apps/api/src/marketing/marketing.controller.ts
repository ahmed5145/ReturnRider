import { Controller, Get, Res } from '@nestjs/common';
import { Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';

@Controller()
export class MarketingController {
  private readMarketingHtml(): string {
    const candidates = [
      path.join(__dirname, '..', '..', '..', '..', 'web', 'public', 'index.html'),
      path.join(process.cwd(), '..', 'web', 'public', 'index.html'),
      path.join(process.cwd(), 'apps', 'web', 'public', 'index.html'),
    ];
    for (const filePath of candidates) {
      if (fs.existsSync(filePath)) {
        return fs.readFileSync(filePath, 'utf8');
      }
    }
    return '<!DOCTYPE html><html><body><h1>ReturnRider</h1><p>Landing page not found.</p></body></html>';
  }

  @Get()
  getHome(@Res() res: Response) {
    res.type('text/html').send(this.readMarketingHtml());
  }
}
