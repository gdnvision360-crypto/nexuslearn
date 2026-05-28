import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const s3 = new S3Client({
  region: process.env.AWS_REGION ?? "us-east-1",
  endpoint: process.env.S3_ENDPOINT,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? "",
  },
  forcePathStyle: true,
});

const BUCKET = process.env.S3_BUCKET ?? "nexuslearn-files";

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const meetingId = formData.get("meetingId") as string;
    const duration = formData.get("duration") as string;
    const mode = formData.get("mode") as string;

    if (!file || !meetingId) {
      return NextResponse.json(
        { error: "Missing file or meetingId" },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const key = `recordings/${meetingId}/${Date.now()}-${file.name}`;

    await s3.send(
      new PutObjectCommand({
        Bucket: BUCKET,
        Key: key,
        Body: buffer,
        ContentType: file.type || "video/webm",
        Metadata: {
          userId: session.user.id,
          meetingId,
          duration: duration ?? "0",
          mode: mode ?? "meeting",
        },
      })
    );

    const url = `${process.env.S3_ENDPOINT ?? "https://s3.amazonaws.com"}/${BUCKET}/${key}`;

    return NextResponse.json({
      id: key,
      url,
      duration: Number(duration),
      mode,
    });
  } catch (error) {
    console.error("Recording upload failed:", error);
    return NextResponse.json(
      { error: "Failed to upload recording" },
      { status: 500 }
    );
  }
}
