import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';
import { configureCloudinary } from './cloudinary.config';
import { PrismaService } from 'src/prisma/prisma.service';

interface UploadFile {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
  size: number;
}

@Injectable()
export class UploadService {
  private cloudinary = cloudinary;

  constructor(
    private config: ConfigService,
    private prisma: PrismaService,
  ) {
    configureCloudinary(this.config);
  }

  async uploadCV(file: UploadFile, userId: string) {
    try {
      const result = await this.uploadToCloudinary(file.buffer, 'resumes', 'auto');

      const resume = await this.prisma.resume.create({
        data: {
          userId,
          fileUrl: result.secure_url,
          publicId: result.public_id,
        },
      });

      return { resumeId: resume.id, fileUrl: resume.fileUrl };
    } catch (error) {
      console.error('Upload CV error:', error);
      throw new InternalServerErrorException('Upload CV thất bại');
    }
  }

  async uploadImages(files: UploadFile[], userId: string) {
    try {
      const existingResume = await this.prisma.resume.findFirst({
        where: { userId },
        include: { images: true },
      });

      if (existingResume) {
        for (const img of existingResume.images) {
          if (img.publicId) {
            await this.cloudinary.uploader.destroy(img.publicId);
          }
        }
        await this.prisma.resumeImage.deleteMany({
          where: { resumeId: existingResume.id },
        });
      }

      const resume = existingResume
        ? existingResume
        : await this.prisma.resume.create({
          data: { userId, fileUrl: '' },
        });

      const uploadResults = await Promise.all(
        files.map((file) =>
          this.uploadToCloudinary(file.buffer, 'resume-images'),
        ),
      );

      await this.prisma.resumeImage.createMany({
        data: uploadResults.map((r) => ({
          resumeId: resume.id,
          imageUrl: r.secure_url,
          publicId: r.public_id,
        })),
      });

      const imageUrls = uploadResults.map((r) => r.secure_url);

      return { resumeId: resume.id, imageUrls };
    } catch (error) {
      console.error('Upload images error:', error);
      throw new InternalServerErrorException('Upload ảnh thất bại');
    }
  }

  private uploadToCloudinary(
    buffer: Buffer,
    folder: string,
    resourceType: 'auto' | 'raw' = 'auto',
  ): Promise<{ secure_url: string; public_id: string }> {
    return new Promise((resolve, reject) => {
      const stream = this.cloudinary.uploader.upload_stream(
        { folder, resource_type: resourceType },
        (error, result) => {
          if (error) reject(error);
          else resolve(result as { secure_url: string; public_id: string });
        },
      );
      stream.end(buffer);
    });
  }
}
