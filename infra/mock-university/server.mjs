import { createRosterServer } from './roster.mjs';

const port = Number(process.env.PORT ?? 3100);
createRosterServer().listen(port, process.env.HOST ?? '0.0.0.0');
