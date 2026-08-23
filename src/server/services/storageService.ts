import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import AWS from 'aws-sdk';

export async function uploadToStorage(buffer: Buffer, originalname: string, mimetype: string) {
  if (process.env.USE_S3 === 'true') {
    const s3 = new AWS.S3({
      region: process.env.S3_REGION,
      accessKeyId: process.env.S3_ACCESS_KEY_ID,
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY
    });
    const key = `${Date.now()}-${uuidv4()}-${originalname.replace(/\s+/g,'_')}`;
    await s3.putObject({
      Bucket: process.env.S3_BUCKET!,
      Key: key,
      Body: buffer,
      ContentType: mimetype,
      ACL: 'private'
    }).promise();
    return `s3://${process.env.S3_BUCKET}/${key}`;
  } else {
    const uploadsDir = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);
    const filename = `${Date.now()}-${uuidv4()}-${originalname.replace(/\s+/g,'_')}`;
    const filepath = path.join(uploadsDir, filename);
    fs.writeFileSync(filepath, buffer);
    // For local dev we return a relative URL
    return `/uploads/${filename}`;
  }
}
