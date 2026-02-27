import { defineConfig, env } from 'prisma/config';
import * as dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

export default defineConfig({
  datasource: {
    url: env('DATABASE_URL'),
  },
});
