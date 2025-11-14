import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { AbstractFileProviderService, MedusaError } from "@medusajs/framework/utils";
import {
  Logger,
  ModuleProviderExports,
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

export class R2FileService extends AbstractFileProviderService {
  static identifier = "r2-file";
  static validateOptions(options: Record<string, any>) {
    const requiredFields = [
      "account_id",
      "access_key_id",
      "secret_access_key",
      "bucket",
      "public_url"
    ];

    for (const field of requiredFields) {
      if (!options?.[field]) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          `${field} is required in the provider's options`
        );
      }
    }
  }

  protected client_: S3Client;
  protected bucket_: string;
  protected publicUrl_: string;
  protected logger_: Logger;

  constructor(
    { logger }: InjectedDependencies,
    options: R2FileOptions
  ) {
    super();

    R2FileService.validateOptions(options);

    this.logger_ = logger;
    this.bucket_ = options.bucket;
    this.publicUrl_ = options.public_url.replace(/\/$/, "");

    this.client_ = new S3Client({
      region: "auto",
      endpoint: `https://${options.account_id}.r2.cloudflarestorage.com`,
      forcePathStyle: true,
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

const services = [R2FileService];

const providerExport: ModuleProviderExports = {
  services,
};

export default providerExport;