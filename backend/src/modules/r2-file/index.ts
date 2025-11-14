import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { AbstractFileProviderService } from "@medusajs/framework/utils";
import {
  Logger,
  ProviderUploadFileDTO,
  ProviderDeleteFileDTO,
  ProviderGetFileDTO,
  ProviderFileResultDTO
} from "@medusajs/framework/types";

type InjectedDependencies = {
  logger: Logger;
};

type R2FileOptions = {
  account_id: string;
  access_key_id: string;
  secret_access_key: string;
  bucket: string;
  public_url: string;
};

class R2FileService extends AbstractFileProviderService {
  static identifier = "r2-file";

  protected client_: S3Client;
  protected bucket_: string;
  protected publicUrl_: string;
  protected logger_: Logger;

  constructor(
    { logger }: InjectedDependencies,
    options: R2FileOptions
  ) {
    super();

    this.logger_ = logger;
    this.bucket_ = options.bucket;
    this.publicUrl_ = options.public_url;

    this.client_ = new S3Client({
      region: "auto",
      endpoint: `https://${options.account_id}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: options.access_key_id,
        secretAccessKey: options.secret_access_key,
      },
    });
  }

  async upload(file: ProviderUploadFileDTO): Promise<ProviderFileResultDTO> {
    try {
      const key = `${Date.now()}-${file.filename}`;

      await this.client_.send(
        new PutObjectCommand({
          Bucket: this.bucket_,
          Key: key,
          Body: file.content,
          ContentType: file.mimeType,
        })
      );

      const url = `${this.publicUrl_}/${key}`;

      return { url, key };
    } catch (error: any) {
      this.logger_.error(`Error uploading file to R2: ${error.message}`);
      throw error;
    }
  }

  async delete(file: ProviderDeleteFileDTO | ProviderDeleteFileDTO[]): Promise<void> {
    const files = Array.isArray(file) ? file : [file];

    try {
      for (const f of files) {
        await this.client_.send(
          new DeleteObjectCommand({
            Bucket: this.bucket_,
            Key: f.fileKey,
          })
        );
      }
    } catch (error: any) {
      this.logger_.error(`Error deleting file from R2: ${error.message}`);
      throw error;
    }
  }

  async getPresignedDownloadUrl(fileData: ProviderGetFileDTO): Promise<string> {
    return `${this.publicUrl_}/${fileData.fileKey}`;
  }
}

// Export as services array
export const services = [R2FileService];

export default R2FileService;