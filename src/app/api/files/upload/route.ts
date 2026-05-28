import { NextRequest } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { prisma } from "@/lib/prisma";
import { requireAuth, handleApiError } from "@/lib/auth-utils";
import { uploadFileSchema } from "@/lib/validations";

const s3Client = new S3Client({
  region: process.env.AWS_REGION || "us-east-1",
  endpoint: process.env.S3_ENDPOINT,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
  forcePathStyle: true,
});

const BUCKET = process.env.S3_BUCKET || "nexuslearn";

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const validated = uploadFileSchema.parse(body);

    const key = `uploads/${user.id}/${Date.now()}-${validated.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;

    // Generate presigned upload URL
    const command = new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      ContentType: validated.mimeType,
      ContentLength: validated.size,
    });

    const presignedUrl = await getSignedUrl(s3Client, command, {
      expiresIn: 3600,
    });

    // Create file record
    const file = await prisma.file.create({
      data: {
        name: validated.name,
        originalName: validated.name,
        mimeType: validated.mimeType,
        size: BigInt(validated.size),
        url: `${process.env.S3_PUBLIC_URL || ""}/${key}`,
        key,
        uploadedById: user.id,
        folderId: validated.folderId,
        parentType: validated.parentType,
        parentId: validated.parentId,
      },
    });

    return Response.json(
      {
        fileId: file.id,
        presignedUrl,
        key,
        url: file.url,
      },
      { status: 201 }
    );
  } catch (error: any) {
    if (error.name === "ZodError") {
      return Response.json({ error: "Validation failed", details: error.errors }, { status: 400 });
    }
    return handleApiError(error);
  }
}
