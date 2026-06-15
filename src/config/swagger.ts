import swaggerUi from 'swagger-ui-express';
import { Express } from 'express';
import swaggerSpec from '../docs/swagger-spec.json';

type OpenApiSpec = typeof swaggerSpec & {
  paths?: Record<string, unknown>;
};

const swaggerDocument = swaggerSpec as OpenApiSpec;

export const setupSwagger = (app: Express): void => {
  const loadedPaths = Object.keys(swaggerDocument.paths ?? {});
  console.log(`Swagger paths loaded: ${loadedPaths.length} -> ${loadedPaths.join(', ')}`);

  app.get('/api-docs.json', (_req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    res.json(swaggerDocument);
  });

  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'VitaLink API Docs',
  }));
};
