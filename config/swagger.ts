export default {
  path: '/docs',
  title: 'API de Logistique',
  version: '1.0.0',
  tagIndex: 2,
  productionEnv: 'production',
  common: {
    consumes: ['application/json'],
    produces: ['application/json'],
  },
  securityDefinitions: {
    bearerAuth: {
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
    },
  },
  security: [
    {
      bearerAuth: [],
    },
  ],
  swaggerUiOptions: {
    customCss: '.swagger-ui .topbar { display: none }',
  },
  definitions: {
    User: {
      type: 'object',
      properties: {
        id: { type: 'number' },
        nom: { type: 'string' },
        prenom: { type: 'string' },
        email: { type: 'string' },
        telephone: { type: 'string' },
        created_at: { type: 'string', format: 'date-time' },
        updated_at: { type: 'string', format: 'date-time' },
      },
    },
    Annonce: {
      type: 'object',
      properties: {
        id: { type: 'number' },
        utilisateur_id: { type: 'number' },
        titre: { type: 'string' },
        description: { type: 'string' },
        status: { type: 'string' },
        scheduled_date: { type: 'string', format: 'date-time' },
        created_at: { type: 'string', format: 'date-time' },
        updated_at: { type: 'string', format: 'date-time' },
      },
    },
    Colis: {
      type: 'object',
      properties: {
        id: { type: 'number' },
        tracking_number: { type: 'string' },
        poids: { type: 'number' },
        dimensions: { type: 'string' },
        status: { type: 'string' },
        created_at: { type: 'string', format: 'date-time' },
        updated_at: { type: 'string', format: 'date-time' },
      },
    },
    Livraison: {
      type: 'object',
      properties: {
        id: { type: 'number' },
        annonce_id: { type: 'number' },
        livreur_id: { type: 'number' },
        status: { type: 'string' },
        created_at: { type: 'string', format: 'date-time' },
        updated_at: { type: 'string', format: 'date-time' },
      },
    },
    Complaint: {
      type: 'object',
      properties: {
        id: { type: 'number' },
        utilisateur_id: { type: 'number' },
        titre: { type: 'string' },
        description: { type: 'string' },
        status: { type: 'string' },
        created_at: { type: 'string', format: 'date-time' },
        updated_at: { type: 'string', format: 'date-time' },
      },
    },
    Message: {
      type: 'object',
      properties: {
        id: { type: 'number' },
        sender_id: { type: 'number' },
        recipient_id: { type: 'number' },
        contenu: { type: 'string' },
        lu: { type: 'boolean' },
        created_at: { type: 'string', format: 'date-time' },
        updated_at: { type: 'string', format: 'date-time' },
      },
    },
  },
}
