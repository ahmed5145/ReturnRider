import { Injectable } from '@nestjs/common';
import { google } from 'googleapis';

export const GMAIL_COMMERCE_QUERY =
  'newer_than:90d (subject:(order OR receipt OR confirmation OR return OR refund OR shipment OR tracking) OR from:(noreply OR no-reply OR orders OR shipping OR returns))';

export const GMAIL_READONLY_SCOPE = 'https://www.googleapis.com/auth/gmail.readonly';

@Injectable()
export class GmailService {
  private createOAuthClient() {
    return new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI ?? 'com.returnrider.app:/oauth2redirect',
    );
  }

  async exchangeCode(
    code: string,
    redirectUri: string,
    codeVerifier: string,
  ) {
    const client = this.createOAuthClient();
    const { tokens } = await client.getToken({
      code,
      redirect_uri: redirectUri,
      codeVerifier,
    });
    if (!tokens.refresh_token) {
      throw new Error('No refresh token received; ensure prompt=consent');
    }
    return tokens;
  }

  getGmailClient(refreshToken: string) {
    const client = this.createOAuthClient();
    client.setCredentials({ refresh_token: refreshToken });
    return google.gmail({ version: 'v1', auth: client });
  }

  async getProfileEmail(refreshToken: string): Promise<string> {
    const gmail = this.getGmailClient(refreshToken);
    const profile = await gmail.users.getProfile({ userId: 'me' });
    return profile.data.emailAddress ?? '';
  }

  async listCommerceMessages(refreshToken: string, pageToken?: string) {
    const gmail = this.getGmailClient(refreshToken);
    const list = await gmail.users.messages.list({
      userId: 'me',
      q: GMAIL_COMMERCE_QUERY,
      maxResults: 50,
      pageToken,
    });
    return list.data;
  }

  async getMessage(refreshToken: string, messageId: string) {
    const gmail = this.getGmailClient(refreshToken);
    const msg = await gmail.users.messages.get({
      userId: 'me',
      id: messageId,
      format: 'full',
    });
    return msg.data;
  }
}
