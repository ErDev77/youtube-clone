import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

export const r2 = new S3Client({
	region: 'auto',
	endpoint: `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
	credentials: {
		accessKeyId: process.env.R2_ACCESS_KEY_ID!,
		secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
	},
})

export async function createPresignedUploadUrl(
	key: string,
	contentType: string,
) {
	const command = new PutObjectCommand({
		Bucket: process.env.R2_BUCKET_NAME!,
		Key: key,
		ContentType: contentType,
	})
	// URL valid for 1 hour
	return getSignedUrl(r2, command, { expiresIn: 3600 })
}
