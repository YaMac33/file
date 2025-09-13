    const { google } = require('googleapis');
    const stream = require('stream');

    const CORS = (origin) => ({
      'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGIN || '*',
      'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    });

    exports.handler = async (event) => {
      // CORS プリフライト対応
      if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 204, headers: CORS(event.headers.origin) };
      }
      if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed', headers: CORS(event.headers.origin) };
      }
      try {
        const origin = event.headers.origin;
        const headers = CORS(origin);

        const body = JSON.parse(event.body);
        const { filename, mimeType, contentBase64 } = body;
        if (!filename || !contentBase64) {
          return { statusCode: 400, body: 'Bad Request: missing fields', headers };
        }

        // サービスアカウント認証
        const key = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY);
        const jwtClient = new google.auth.JWT({
          email: key.client_email,
          key: key.private_key,
          scopes: ['https://www.googleapis.com/auth/drive.file']
        });
        await jwtClient.authorize();

        const drive = google.drive({ version: 'v3', auth: jwtClient });

        // base64 -> Buffer -> Readable stream
        const buffer = Buffer.from(contentBase64, 'base64');
        const bufferStream = new stream.PassThrough();
        bufferStream.end(buffer);

        const res = await drive.files.create({
          requestBody: {
            name: filename,
            parents: process.env.DRIVE_PARENT_FOLDER_ID ? [process.env.DRIVE_PARENT_FOLDER_ID] : undefined
          },
          media: {
            mimeType: mimeType || 'application/octet-stream',
            body: bufferStream
          },
          fields: 'id, name, mimeType'
        });

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ ok: true, fileId: res.data.id, name: res.data.name })
        };
      } catch (err) {
        console.error(err);
        return { statusCode: 500, body: 'Internal Server Error: ' + (err.message || err.toString()) };
      }
    };
