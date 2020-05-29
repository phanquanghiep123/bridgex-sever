import { Injectable, OnApplicationShutdown, INestApplication } from "@nestjs/common";

import { Subject, combineLatest, Observable } from "rxjs";
import { mergeMap } from "rxjs/operators";

import { LoggerService } from "../logger";

@Injectable()
export class ShutdownService implements OnApplicationShutdown {
  private shutdowning = false;
  private shutdownListener$: Subject<void> = new Subject();

  constructor(private logger: LoggerService) {}

  // This function picks up SIGNAL about stopping this app when the SIGNAL emitted. For example, SIGTERM, SIGINT, SIGKILL.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public onApplicationShutdown(signal: string) {
    if (!this.shutdowning) {
      this.shutdowning = true;
      this.shutdownListener$.next();
    }
  }

  // It is required that executing this function with app.close in main.ts
  public configureGracefulShutdown(shutdownFn: () => Observable<any> | Promise<any>) {
    this.shutdownListener$.pipe(mergeMap(() => shutdownFn())).subscribe({
      next: () => {
        this.logger.info("Succeeded graceful shutdown");
        process.exit(0);
      },
      error: () => {
        this.logger.error("Failed graceful shutdown");
        process.exit(1);
      },
    });

    this.logger.info("I completed to prepare graceful shutdown");
  }

  public teardown$(app: INestApplication): Observable<any> {
    return combineLatest(app.close());
  }
}
