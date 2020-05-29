import { Injectable } from "@nestjs/common";
import { Observable, throwError } from "rxjs";
import { catchError, map } from "rxjs/operators";

import { UserInfo } from "./user-auth.service.i";
import { GuardUserAuthService } from "./user-auth.service.guard";
import { HttpClientService } from "../http-client";
import { ConfigService } from "../config";
import { LoggerService } from "../logger/logger.service";
import { ErrorCode, BridgeXServerError } from "../utils";

@Injectable()
export class UserAuthService {
  public constructor(
    public guard: GuardUserAuthService,
    public httpClient: HttpClientService,
    public config: ConfigService,
    public logger: LoggerService,
  ) {}

  public getUserInfo$(accessToken: string): Observable<UserInfo> {
    const path = `${this.config.gConnectConfig().userAuthBaseUrl}/userinfo`;

    const headers = {
      "Content-Type": "application/json",
      Authorization: "Bearer " + accessToken,
    };

    return this.httpClient
      .get$<any>(path, { headers })
      .pipe(
        map((res: any) => {
          if (!this.guard.isGetUserInfoResponse(res.data)) {
            throw new BridgeXServerError(ErrorCode.INTERNAL, "invalid data from g-connect");
          }
          return res.data;
        }),
        catchError((err) => {
          this.logger.error("getUserInfo failed", { error: err.toString() });
          return throwError(new BridgeXServerError(ErrorCode.INTERNAL, "Unexpected Error", err));
        }),
      );
  }
}
