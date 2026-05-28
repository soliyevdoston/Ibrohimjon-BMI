import {
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UploadsService } from './uploads.service';

@Controller('uploads')
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 8 * 1024 * 1024 } }))
  async upload(@UploadedFile() file: Express.Multer.File) {
    const upload = await this.uploadsService.save(file.buffer, file.mimetype);
    return { url: `/api/v1/uploads/${upload.id}` };
  }

  @Get(':id')
  async serve(@Param('id') id: string, @Res() res: Response) {
    const upload = await this.uploadsService.findOne(id);
    if (!upload) throw new NotFoundException('Rasm topilmadi');
    res.setHeader('Content-Type', upload.mimeType);
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    res.end(upload.data);
  }
}
