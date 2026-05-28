import { NextRequest } from "next/server";
import { S3Client, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { prisma } from "@/lib/prisma";
import { requireAuth, handleApiError } from "@/lib/auth-utils";

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

type RouteContext = { params: { fileId: string } };

export async function GET(request: NextRequest, { params }: RouteContext) {
  try {
    await requireAuth();
    const { fileId } = params;

    const file = await prisma.file.findUnique({
      where: { id: fileId },
      include: {
        uploadedBy: {
          select: { id: true, name: true, email: true, image: true },
        },
        folder: { select: { id: true, name: true } },
      },
    });

    if (!file) {
      return Response.json({ error: "File not found" }, { status: 404 });
    }

    // Generate presigned download URL
    const command = new GetObjectCommand({
      Bucket: BUCKET,
      Key: file.key,
    });

    const downloadUrl = await getSignedUrl(s3Client, command, {
      expiresIn: 3600,
    });

    return Response.json({
      ...file,
      size: file.size.toString(),
      downloadUrl,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: NextRequest, { params }: RouteContext) {
  try {
    const user = await requireAuth();
    const { fileId } = params;

    const file = await prisma.file.findUnique({
      where: { id: fileId },
    });

    if (!file) {
      return Response.json({ error: "File not found" }, { status: 404 });
    }

    if (file.uploadedById !== user.id && user.role !== "ADMIN") {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    // Delete from S3
    try {
      await s3Client.send(
        new DeleteObjectCommand({
          Bucket: BUCKET,
          Key: file.key,
        })
      );
    } catch (s3Error) {
      console.error("[S3 Delete Error]", s3Error);
      // Continue with DB deletion even if S3 fails
    }

    await prisma.file.delete({ where: { id: fileId } });

    return Response.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
