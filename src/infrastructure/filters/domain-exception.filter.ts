import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
} from '@nestjs/common';
import { ClientNotFoundException } from '../../domain/exceptions/client-not-found.exception';
import { ClientAlreadyExistsException } from '../../domain/exceptions/client-already-exists.exception';
import { AcompteInsuffisantException } from '../../domain/exceptions/acompte-insuffisant.exception';
import { CommandeStatutInvalideException } from '../../domain/exceptions/commande-statut-invalide.exception';
import { InvalidCredentialsException } from '../../domain/exceptions/invalid-credentials.exception';
import { CommandeNotFoundException } from '../../domain/exceptions/commande-not-found.exception';

@Catch()
export class DomainExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();
    const timestamp = new Date().toISOString();
    const path = request.url;

    if (exception instanceof ClientNotFoundException) {
      return response.status(404).json({
        success: false,
        error: {
          code: 'CLIENT_NOT_FOUND',
          message: exception.message,
          timestamp, path,
        },
      });
    }

    if (exception instanceof ClientAlreadyExistsException) {
      return response.status(409).json({
        success: false,
        error: {
          code: 'CLIENT_ALREADY_EXISTS',
          message: exception.message,
          timestamp, path,
        },
      });
    }

    if (exception instanceof AcompteInsuffisantException) {
      return response.status(400).json({
        success: false,
        error: {
          code: 'ACOMPTE_INSUFFISANT',
          message: exception.message,
          details: {
            montantRecu: exception.montantRecu,
            montantMinimum: exception.montantMinimum,
            montantTTC: exception.montantTTC,
          },
          timestamp, path,
        },
      });
    }

    if (exception instanceof CommandeStatutInvalideException) {
      return response.status(400).json({
        success: false,
        error: {
          code: 'COMMANDE_STATUT_INVALIDE',
          message: exception.message,
          timestamp, path,
        },
      });
    }

    if (exception instanceof InvalidCredentialsException) {
      return response.status(401).json({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: exception.message,
          timestamp, path,
        },
      });
    }

    if (exception instanceof CommandeNotFoundException) {
      return response.status(404).json({
        success: false,
        error: {
          code: 'COMMANDE_NOT_FOUND',
          message: exception.message,
          timestamp, path,
        },
      });
    }

    if (exception instanceof HttpException) {
      return response.status(exception.getStatus()).json({
        success: false,
        error: {
          code: 'HTTP_ERROR',
          message: exception.message,
          timestamp, path,
        },
      });
    }

    console.error('Unhandled exception:', exception);
    return response.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Erreur serveur interne',
        timestamp, path,
      },
    });
  }
}
