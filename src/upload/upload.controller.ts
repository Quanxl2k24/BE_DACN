import {
  Controller,
  Post,
  UploadedFile,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
  Req,
  ParseFilePipeBuilder,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { AccessTokenGuard } from 'src/auth/guard/access-token.guard';
import { UploadService } from './upload.service';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import type { Request } from 'express';

interface UploadFile {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
  size: number;
}

const CV_REGEX = /^(application\/pdf|application\/msword|application\/vnd\.openxmlformats-officedocument\.wordprocessingml\.document)$/;
const IMAGE_REGEX = /^(image\/jpeg|image\/png|image\/webp)$/;
const MAX_SIZE = 5 * 1024 * 1024;

@ApiTags('Upload - Tải lên tệp')
@Controller('upload')
export class UploadController {
  constructor(private uploadService: UploadService) { }

  @Post('cv')
  @UseGuards(AccessTokenGuard)
  @UseInterceptors(FileInterceptor('cv'))
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        cv: { type: 'string', format: 'binary', description: 'File CV (PDF, DOC, DOCX)' },
      },
    },
  })
  @ApiOperation({ summary: 'Tải lên CV', description: 'Tải file CV lên Cloudinary. Hỗ trợ PDF, DOC, DOCX (tối đa 5MB).' })
  uploadCV(
    @UploadedFile(
      new ParseFilePipeBuilder()
        .addFileTypeValidator({ fileType: CV_REGEX })
        .addMaxSizeValidator({ maxSize: MAX_SIZE })
        .build(),
    )
    file: UploadFile,
    @Req() req: Request,
  ) {
    if (!file) throw new BadRequestException('Vui lòng chọn file CV');
    return this.uploadService.uploadCV(file, req.user!.sub);
  }

  @Post('images')
  @UseGuards(AccessTokenGuard)
  @UseInterceptors(FilesInterceptor('images', 5))
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        images: {
          type: 'array',
          items: { type: 'string', format: 'binary' },
          description: 'Danh sách ảnh (tối đa 5 file, định dạng JPEG/PNG/WEBP)',
        },
      },
    },
  })
  @ApiOperation({ summary: 'Tải lên ảnh', description: 'Tải lên tối đa 5 ảnh (JPEG/PNG/WEBP, mỗi ảnh tối đa 5MB).' })
  uploadImages(
    @UploadedFiles(
      new ParseFilePipeBuilder()
        .addFileTypeValidator({ fileType: IMAGE_REGEX })
        .addMaxSizeValidator({ maxSize: MAX_SIZE })
        .build(),
    )
    files: UploadFile[],
    @Req() req: Request,
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('Vui lòng chọn ít nhất 1 ảnh');
    }
    return this.uploadService.uploadImages(files, req.user!.sub);
  }
}
