import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { AbstractFileProviderService } from "@medusajs/framework/utils";
import { Logger } from "@medusajs/framework/types";

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

  async upload(file: Express.Multer.File): Promise<{ url: string; key: string }> {
    try {
      const key = `${Date.now()}-${file.originalname}`;

      await this.client_.send(
        new PutObjectCommand({
          Bucket: this.bucket_,
          Key: key,
          Body: file.buffer,
          ContentType: file.mimetype,
        })
      );

      const url = `${this.publicUrl_}/${key}`;

      return { url, key };
    } catch (error) {
      this.logger_.error(`Error uploading file to R2: ${error.message}`);
      throw error;
    }
  }

  async delete(fileKey: string): Promise<void> {
    // Implement delete if needed
    this.logger_.info(`Delete file: ${fileKey}`);
  }

  async getPresignedDownloadUrl(fileKey: string): Promise<string> {
    return `${this.publicUrl_}/${fileKey}`;
  }
}

export default R2FileService;