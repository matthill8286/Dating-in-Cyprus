import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { apiError } from '../account/contracts';
import { photoVerificationBody, photoVerificationResponse } from './contracts';
import { readPhotoVerification, startPhotoVerification, type VerifyDeps } from './verify';

const idParam = z.object({ photoVerificationId: z.string() });

export async function photoVerificationRoutes(
  app: FastifyInstance,
  opts: VerifyDeps,
): Promise<void> {
  const typed = app.withTypeProvider<ZodTypeProvider>();

  typed.post(
    '/v1/photo-verifications',
    {
      schema: {
        body: photoVerificationBody,
        response: {
          200: photoVerificationResponse,
          403: apiError,
          404: apiError,
          502: apiError,
        },
      },
    },
    async (req, reply) =>
      startPhotoVerification(req.accountId, Boolean(req.body.skip), reply, opts),
  );

  typed.get(
    '/v1/photo-verifications/:photoVerificationId',
    {
      schema: {
        params: idParam,
        response: { 200: photoVerificationResponse, 403: apiError, 404: apiError },
      },
    },
    async (req, reply) =>
      readPhotoVerification(req.params.photoVerificationId, req.accountId, reply, opts),
  );
}
