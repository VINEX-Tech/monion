import { INestApplication } from '@nestjs/common';
import helmet from 'helmet';

/** Settings shared by the real server and the HTTP tests. */
export function configureApp(app: INestApplication): INestApplication {
  app.use(helmet());
  app.enableCors({
    origin: process.env.DASHBOARD_ORIGIN ?? 'http://localhost:5173',
    credentials: true,
  });
  app.setGlobalPrefix('v1');
  app.enableShutdownHooks();
  return app;
}
