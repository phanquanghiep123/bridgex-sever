import { CanActivate, ExecutionContext, Injectable, HttpService } from "@nestjs/common";

import { Request } from "express";

import { Observable, of } from "rxjs";

import { map, catchError, tap } from "rxjs/operators";

import { ConfigService } from "../../service/config";

import { LoggerService } from "../../service/logger";

// --------------------------------------

export interface ValidateTokenResponse {
  active: boolean;
}

@Injectable()
export class BearerTokenGuard implements CanActivate {
  public constructor(private httpClient: HttpService, private config: ConfigService, private logger: LoggerService) {}

  public canActivate(context: ExecutionContext): Observable<boolean> {
    if (!this.config.appConfig().production) {
      return of(true);
    }

    const req: Request = context.switchToHttp().getRequest();

    const bearerToken = req.header("authorization") || "";
    this.logger.info("BearerTokenGuard.canActivate: ", { method: req.method, url: req.url, headers: req.headers });

    if (!/^Bearer\s.+/.test(bearerToken)) {
      this.logger.info("BearerTokenGuard.canActivate: Authorization header must start with Bearer");
      return of(false);
    }

    const body = {
      token: bearerToken.replace(/^Bearer\s/, ""),
    };

    const path = `${this.config.gConnectConfig().userAuthBaseUrl}/validateToken`;

    return this.httpClient.post<ValidateTokenResponse>(path, body).pipe(
      tap((res) => this.logger.info("BearerTokenGuard.canActivate: validateToken", res.data)),
      map((res) => this.isValidateTokenResponse(res.data) && res.data.active),
      catchError((e) => {
        this.logger.info(e.toString());
        return of(false);
      }),
    );
  }

  public isValidateTokenResponse(params: any): params is ValidateTokenResponse {
    if (!params) {
      return false;
    }
    if (typeof params.active !== "boolean") {
      return false;
    }
    return true;
  }
}
