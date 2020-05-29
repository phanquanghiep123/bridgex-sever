import { S3, AWSError, Request } from "aws-sdk";
import _fs from "fs";
import internal from "stream";

import { Injectable } from "@nestjs/common";

import { Observable, of, throwError, bindNodeCallback, fromEvent, merge } from "rxjs";

import { switchMap, catchError, map, tap, filter, take, mergeMap } from "rxjs/operators";

import { LoggerService } from "../logger";

import { ConfigService } from "../config";

import { IbmCosError, EIbmCosError } from "./ibm-cos.service.i";

// -----------------------------------------------------
export const fs = { ..._fs };

// -----------------------------------------------------

@Injectable()
export class IbmCosService {
  public static readonly defaultExpires = 60 * 60 * 24;

  public constructor(private readonly logger: LoggerService, private readonly config: ConfigService) {}

  public getClient(): S3 {
    const config = this.config.objectStorageConfig();
    const opts: S3.ClientConfiguration = {
      signatureVersion: "v4",
      endpoint: `${config.endpoint}${config.port ? ":" + config.port : ""}`,
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
      s3ForcePathStyle: true,
    };
    if (config.proxy) {
      opts.httpOptions = { proxy: config.proxy };
    }
    return new S3(opts);
  }

  public getFile$(objectName: string, outputFilePath: string): Observable<string> {
    const config = this.config.objectStorageConfig();
    const bucket = config.bucket;

    return of(outputFilePath).pipe(
      switchMap(() => {
        const s3Stream = this.getS3ReadableStream(bucket, objectName, outputFilePath);

        return merge(
          fromEvent(s3Stream, "error").pipe(
            tap(() => this.logger.info(`s3-stream event. error:${bucket}:${objectName}`)),
            mergeMap((e: any) => throwError(e)),
          ),
          fromEvent(s3Stream, "data").pipe(filter(() => false)),
          fromEvent(s3Stream, "end").pipe(tap(() => this.logger.info(`s3-stream event. end:${bucket}:${objectName}`))),
          fromEvent(s3Stream, "close").pipe(tap(() => this.logger.info(`s3-stream event. close:${bucket}:${objectName}`))),
          fromEvent(s3Stream, "finish").pipe(tap(() => this.logger.info(`s3-stream event. finish:${bucket}:${objectName}`))),
        ).pipe(take(1));
      }),
      map(() => outputFilePath),
      tap(() => this.logger.info("Succeeded to get file from external storage")),
      catchError((err: AWSError) => {
        this.logger.error(`IbmCosService.getFile$: ${err.message}`, err);
        return throwError(new IbmCosError(EIbmCosError.AWS_ERROR, err));
      }),
    );
  }

  // internal
  public getS3ReadableStream(bucket: string, objectName: string, outputFilePath: string): internal.Readable {
    const client = this.getClient();

    const params: S3.GetObjectRequest = {
      Bucket: bucket,
      Key: objectName,
    };

    const outStream: _fs.WriteStream = fs.createWriteStream(outputFilePath);
    const request: Request<S3.GetObjectOutput, AWSError> = client.getObject(params);
    const s3Stream: internal.Readable = request.createReadStream();
    s3Stream.pipe(outStream);

    return s3Stream;
  }

  public headObject$(objectName: string): Observable<S3.HeadObjectOutput> {
    const client = this.getClient();
    const config = this.config.objectStorageConfig();

    const params: S3.HeadObjectRequest = {
      Bucket: config.bucket,
      Key: objectName,
    };

    return of(null).pipe(
      switchMap(() => {
        return bindNodeCallback<any, S3.GetObjectOutput>(client.headObject.bind(client))(params);
      }),
      catchError((err: AWSError) => {
        this.logger.error(`IbmCosService.headObject$: ${err.message}`, err);
        return throwError(new IbmCosError(EIbmCosError.AWS_ERROR, err));
      }),
    );
  }

  public getObject$(objectName: string): Observable<S3.GetObjectOutput> {
    const client = this.getClient();
    const config = this.config.objectStorageConfig();

    const params: S3.GetObjectRequest = {
      Bucket: config.bucket,
      Key: objectName,
    };

    return of(null).pipe(
      switchMap(() => {
        return bindNodeCallback<any, S3.GetObjectOutput>(client.getObject.bind(client))(params);
      }),
      catchError((err: AWSError) => {
        this.logger.error(`IbmCosService.getObject$: ${err.message}`, err);
        return throwError(new IbmCosError(EIbmCosError.AWS_ERROR, err));
      }),
    );
  }

  public putObject$(objectName: string, body: S3.Body): Observable<S3.GetObjectOutput> {
    const client = this.getClient();
    const config = this.config.objectStorageConfig();

    const params: S3.Types.PutObjectRequest = {
      Bucket: config.bucket,
      Key: objectName,
      Body: body,
    };

    return of(null).pipe(
      switchMap(() => {
        return bindNodeCallback<any, S3.GetObjectOutput>(client.putObject.bind(client))(params);
      }),
      catchError((err: AWSError) => {
        this.logger.error(`IbmCosService.putObject$: ${err.message}`, err);
        return throwError(new IbmCosError(EIbmCosError.AWS_ERROR, err));
      }),
    );
  }

  public deleteObject$(objectName: string): Observable<any> {
    const client = this.getClient();
    const config = this.config.objectStorageConfig();

    const params: S3.GetObjectRequest = {
      Bucket: config.bucket,
      Key: objectName,
    };

    return of(null).pipe(
      switchMap(() => {
        return bindNodeCallback<any, S3.GetObjectOutput>(client.deleteObject.bind(client))(params);
      }),
      catchError((err: AWSError) => {
        this.logger.error(`IbmCosService.getObject$: ${err.message}`, err);
        return throwError(new IbmCosError(EIbmCosError.AWS_ERROR, err));
      }),
    );
  }

  public getObjectUrl$(objectName: string, expires: number = IbmCosService.defaultExpires): Observable<string> {
    const client = this.getClient();
    const config = this.config.objectStorageConfig();

    const params: S3.GetObjectRequest & { Expires: number } = {
      Bucket: config.bucket,
      Key: objectName,
      Expires: expires,
    };

    return of(null).pipe(
      switchMap(() => client.getSignedUrlPromise("getObject", params)),
      catchError((err: AWSError) => {
        this.logger.error(`IbmCosService.getObjectUrl$: ${err.message}`, err);
        return throwError(new IbmCosError(EIbmCosError.AWS_ERROR, err));
      }),
    );
  }

  public putObjectUrl$(objectName: string, expires: number = IbmCosService.defaultExpires): Observable<string> {
    const client = this.getClient();
    const config = this.config.objectStorageConfig();

    const params: S3.PutObjectRequest | { Expires: number } = {
      Bucket: config.bucket,
      Key: objectName,
      Expires: expires,
    };

    return of(null).pipe(
      switchMap(() => client.getSignedUrlPromise("putObject", params)),
      catchError((err: AWSError) => {
        this.logger.error(`IbmCosService.putObjectUrl$: ${err.message}`, err);
        return throwError(new IbmCosError(EIbmCosError.AWS_ERROR, err));
      }),
    );
  }

  public convertUrlToCOSKey(url: string): string {
    return url
      .replace(/(.+):\/\//, "") // remove protocol
      .replace(/(^.+?)(\/)/, ""); // remove host and port
  }
}
