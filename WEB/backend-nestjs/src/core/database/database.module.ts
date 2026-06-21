import * as dns from 'node:dns';
import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import mongoose from 'mongoose';
import { AppLoggerModule } from '../logger/logger.module';
import { AppLoggerService } from '../logger/logger.service';

type ParsedDatabaseError = Error & {
  code?: string;
  customMessage?: string;
};

const parseDatabaseError = (error: unknown): ParsedDatabaseError => {
  const parsed = error as ParsedDatabaseError;
  const lower = String(parsed?.message || '').toLowerCase();

  parsed.code = 'DB_UNAVAILABLE';
  parsed.customMessage = 'Database is unavailable. Please try again.';

  if (lower.includes('querysrv') || lower.includes('enotfound') || lower.includes('econnrefused')) {
    parsed.code = 'DB_DNS_RESOLUTION_FAILED';
    parsed.customMessage = 'Database hostname resolution failed.';
  } else if (
    lower.includes('server selection timed out') ||
    lower.includes('econnreset') ||
    lower.includes('etimedout')
  ) {
    parsed.code = 'DB_CONNECTION_TIMEOUT';
    parsed.customMessage = 'Database connection timed out.';
  } else if (lower.includes('authentication failed') || lower.includes('bad auth')) {
    parsed.code = 'DB_AUTH_FAILED';
    parsed.customMessage = 'Database authentication failed.';
  } else if (
    lower.includes('not allowed to access this mongodb deployment') ||
    lower.includes('ip address')
  ) {
    parsed.code = 'DB_NETWORK_DENIED';
    parsed.customMessage = 'Database network access is denied.';
  } else if (lower.includes('uri') || lower.includes('connection string')) {
    parsed.code = 'DB_URL_INVALID';
    parsed.customMessage = 'Database connection string is invalid.';
  }

  return parsed;
};

const probeConnection = async (uri: string) => {
  const connection = mongoose.createConnection(uri, {
    dbName: 'iti_Grad_Project',
    serverSelectionTimeoutMS: 15000,
    socketTimeoutMS: 45000,
  });

  try {
    await connection.asPromise();
  } finally {
    await connection.close().catch(() => undefined);
  }
};

@Global()
@Module({
  imports: [
    ConfigModule,
    AppLoggerModule,
    MongooseModule.forRootAsync({
      imports: [ConfigModule, AppLoggerModule],
      useFactory: async (configService: ConfigService, logger: AppLoggerService) => {
        const dnsServers = String(configService.get<string>('DNS_SERVERS', ''))
          .split(',')
          .map((server) => server.trim())
          .filter(Boolean);

        if (dnsServers.length > 0) {
          try {
            dns.setServers(dnsServers);
            logger.log(`Custom DNS servers applied: ${dnsServers.join(', ')}`);
          } catch (error) {
            logger.warn('Failed to apply custom DNS servers; falling back to system DNS', {
              dnsServers,
              message: (error as Error).message,
            });
          }
        }

        const primaryUrl = configService.get<string>('DB_URL');
        const fallbackUrl = configService.get<string>('DB_URL_FALLBACK');

        if (!primaryUrl) {
          const error = new Error('DB_URL is not configured') as ParsedDatabaseError;
          error.code = 'DB_URL_MISSING';
          error.customMessage = 'Database config is missing on server.';
          throw error;
        }

        let selectedUrl = primaryUrl;
        let selectedLabel = 'DB_URL';

        if (fallbackUrl && fallbackUrl !== primaryUrl) {
          try {
            await probeConnection(primaryUrl);
          } catch (error) {
            const parsedError = parseDatabaseError(error);
            if (parsedError.code === 'DB_DNS_RESOLUTION_FAILED') {
              logger.warn('Primary DB URL failed with DNS issue. Trying DB_URL_FALLBACK.', {
                code: parsedError.code,
                message: parsedError.message,
              });
              selectedUrl = fallbackUrl;
              selectedLabel = 'DB_URL_FALLBACK';
            } else {
              throw parsedError;
            }
          }
        }

        logger.log(`Attempting database connection via ${selectedLabel}`);

        return {
          uri: selectedUrl,
          dbName: 'iti_Grad_Project',
          serverSelectionTimeoutMS: 15000,
          socketTimeoutMS: 45000,
          retryAttempts: 0,
          connectionFactory: (connection: mongoose.Connection) => {
            connection.on('connected', () => {
              logger.log('Database connection established successfully');
            });
            connection.on('error', (err) => {
              const parsedError = parseDatabaseError(err);
              logger.error(parsedError.customMessage || parsedError.message, parsedError.stack);
            });
            return connection;
          },
        };
      },
      inject: [ConfigService, AppLoggerService],
    }),
  ],
  exports: [MongooseModule],
})
export class DatabaseModule {}
