import { google } from 'googleapis';

/**
 * Mendapatkan autentikasi Google (OAuth2 atau Service Account)
 * Secara otomatis memilih OAuth2 jika tersedia, atau fallback ke Service Account.
 */
export async function getGoogleAuth() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;

  // Prioritaskan OAuth2 jika ada (Solusi Kuota Drive)
  if (clientId && clientSecret && refreshToken) {
    const oauth2Client = new google.auth.OAuth2(clientId, clientSecret);
    oauth2Client.setCredentials({
      refresh_token: refreshToken
    });
    return oauth2Client;
  }

  // Fallback ke Service Account JSON
  const jsonStr = process.env.GOOGLE_SERVICE_ACCOUNT_KEY || process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!jsonStr) {
    throw new Error('Neither OAuth2 (Client ID/Secret/Refresh) nor GOOGLE_SERVICE_ACCOUNT_KEY/JSON environment variables are provided.');
  }

  let credentials;
  try {
    credentials = JSON.parse(jsonStr);
  } catch (e: any) {
    throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON is not a valid JSON: ' + e.message);
  }

  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: [
      'https://www.googleapis.com/auth/spreadsheets',
      'https://www.googleapis.com/auth/drive'
    ]
  });

  return auth;
}

export async function getDrive() {
  const auth = await getGoogleAuth();
  return google.drive({ version: 'v3', auth });
}

export async function getSheets() {
  const auth = await getGoogleAuth();
  return google.sheets({ version: 'v4', auth });
}
