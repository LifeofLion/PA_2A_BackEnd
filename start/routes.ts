/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import router from '@adonisjs/core/services/router'
// const SwaggerController = () => import('../app/controllers/swagger_controller.js')
const EmailController = () => import('#controllers/send_email')
const CodeTemporaireController = () => import('#controllers/codes_temporaire_controller')
const AuthController = () => import('#controllers/auth_controller')
const UtilisateursController = () => import('#controllers/utilisateurs_controller')
const ClientController = () => import('#controllers/clients_controller')
const LivreurController = () => import('#controllers/livreurs_controller')
const PrestataireController = () => import('#controllers/prestataires_controller')
const CommercantController = () => import('#controllers/commercants_controller')
const AnnonceController = () => import('#controllers/annonces_controller')
const ColisController = () => import('#controllers/colis_controller')
const LivraisonController = () => import('#controllers/livraisons_controller')
const MessageController = () => import('#controllers/messages_controller')
const StockageColisController = () => import('#controllers/stockage_colis_controller')
const WharehousesController = () => import('#controllers/wharehouses_controller')
const ComplaintsController = () => import('#controllers/complaints_controller')
const AdminController = () => import('#controllers/admin_controller')
const ServicesController = () => import('#controllers/services_controller')
const AnnonceServicesController = () => import('#controllers/annonce_services_controller')
const JustificationPiecesController = () => import('#controllers/justification_pieces_controller')
const TrackingController = () => import('#controllers/tracking_controller')

import { middleware } from '#start/kernel'

// Routes Swagger
// router.get('/swagger', [SwaggerController, 'getJSON'])
// router.get('/docs', [SwaggerController, 'getUI'])

router.get('/', async () => {
  return {
    message: 'Welcome to the API',
    version: '0.1 Beta',
  }
})

router.post('send-email', [EmailController, 'sendEmail'])

router
  .group(() => {
    router.post('generate-code', [CodeTemporaireController, 'generate_code'])
    router.post('check-code', [CodeTemporaireController, 'check_code'])
    router.post('reset-code', [CodeTemporaireController, 'reset_code'])
  })
  .prefix('codes-temporaire')

router
  .group(() => {
    router.post('login', [AuthController, 'login'])
    router.post('register', [AuthController, 'register'])
    router.get('me', [AuthController, 'me']).use(middleware.auth())
    router.post('logout', [AuthController, 'remove_token']).use(middleware.auth())
  })
  .prefix('auth')

router
  .group(() => {
    router.get('all', [UtilisateursController, 'getIndex'])
    router.get(':id', [UtilisateursController, 'get']).use(middleware.auth())
    router.put(':id', [UtilisateursController, 'update']).use(middleware.auth())
    router.post('check-password', [UtilisateursController, 'checkPassword'])
  })
  .prefix('utilisateurs')

router
  .group(() => {
    router.post('add', [ClientController, 'add'])
    router.get(':id/profile', [ClientController, 'getProfile'])
    router.put(':id/profile', [ClientController, 'updateProfile'])
  })
  .prefix('clients')

router
  .group(() => {
    router.post('add', [LivreurController, 'add'])
    router.get(':id/profile', [LivreurController, 'getProfile'])
    router.put(':id/profile', [LivreurController, 'updateProfile'])
    router.get(':id/livraisons', [LivreurController, 'getLivraisons']).use(middleware.auth())
    router
      .get('livraisons/available', [LivreurController, 'getAvailableLivraisons'])
      .use(middleware.auth())
    router
      .post(':id/livraisons/:livraisonId/accept', [LivreurController, 'acceptLivraison'])
      .use(middleware.auth())
    router
      .put(':id/livraisons/:livraisonId/status', [LivreurController, 'updateLivraisonStatus'])
      .use(middleware.auth())
    router.get(':id/stats', [LivreurController, 'getStats']).use(middleware.auth())
    router.put(':id/availability', [LivreurController, 'updateAvailability']).use(middleware.auth())
  })
  .prefix('livreurs')

router
  .group(() => {
    router.post('add', [PrestataireController, 'add'])
    router.get(':id/profile', [PrestataireController, 'getProfile'])
    router.put(':id/profile', [PrestataireController, 'updateProfile'])
  })
  .prefix('prestataires')

router
  .group(() => {
    router.post('add', [CommercantController, 'add'])
    router.get(':id/profile', [CommercantController, 'getProfile'])
    router.put(':id/profile', [CommercantController, 'updateProfile'])
    router.post('reject/:id', [CommercantController, 'reject'])
    router.post('verify/:id', [CommercantController, 'verify'])
    router.get('unverified', [CommercantController, 'getUnverified'])
    router.get('verified', [CommercantController, 'getVerified'])
  })
  .prefix('commercants')

router
  .group(() => {
    router.get('/', [AnnonceController, 'getAllAnnonces'])
    router.post('create', [AnnonceController, 'create'])
    router.post(':id/livraisons', [LivraisonController, 'create'])
    router.get(':id', [AnnonceController, 'getAnnonce'])
    router.get('/user/:utilisateur_id', [AnnonceController, 'getUserAnnonces'])
    router.put(':id', [AnnonceController, 'updateAnnonce'])
    router.put(':id/with-string-dates', [AnnonceController, 'updateAnnonceWithStringDates'])
    router.post(':id/services', [AnnonceServicesController, 'attachServices'])
    router.delete(':id/services', [AnnonceServicesController, 'detachServices'])
    router.get(':id/services', [AnnonceServicesController, 'getServices'])
  })
  .prefix('annonces')

router
  .group(() => {
    router.post('create', [ColisController, 'create'])
    router.get(':tracking_number', [ColisController, 'getColis'])
    router.get(':tracking_number/location-history', [ColisController, 'getLocationHistory'])
    router.post(':tracking_number/update-location', [ColisController, 'updateLocation'])
  })
  .prefix('colis')

// Groupe de routes administratives pour les colis
router
  .group(() => {
    router.get('/', [ColisController, 'getAllColis'])
  })
  .prefix('admin/colis')
  .use([middleware.auth(), middleware.admin()])

router
  .group(() => {
    router.post('create', [WharehousesController, 'create'])
    router.get('/', [WharehousesController, 'getAllWharehouses'])
    router.get(':id', [WharehousesController, 'getWharehouse'])
    router.put(':id', [WharehousesController, 'update'])
    router.delete(':id', [WharehousesController, 'delete'])
    router.get(':id/capacity', [WharehousesController, 'getAvailableCapacity'])
  })
  .prefix('wharehouses')

router
  .group(() => {
    router.post('create', [StockageColisController, 'create'])
    router.get(':id', [StockageColisController, 'show'])
    router.get('colis/:colis_id', [StockageColisController, 'getByColisId'])
    router.put(':id', [StockageColisController, 'update'])
    router.delete(':id', [StockageColisController, 'delete'])
    router.post('move-to-client', [StockageColisController, 'moveToClientAddress'])
  })
  .prefix('stockage-colis')

router
  .group(() => {
    router.get(':id', [LivraisonController, 'show'])
    router.put(':id', [LivraisonController, 'update'])
  })
  .prefix('livraisons')

router
  .group(() => {
    router.post('/', [MessageController, 'send']).use(middleware.auth())
    router.get('inbox', [MessageController, 'inbox']).use(middleware.auth())
    router.get('conversations', [MessageController, 'conversations']).use(middleware.auth())
    router.get('available-users', [MessageController, 'getAvailableUsers']).use(middleware.auth())
    router.put(':id/read', [MessageController, 'markRead']).use(middleware.auth())
  })
  .prefix('messages')

router
  .group(() => {
    router.get('/', [ComplaintsController, 'index'])
    router.post('/', [ComplaintsController, 'create'])
    router.get(':id', [ComplaintsController, 'show'])
    router.put(':id', [ComplaintsController, 'update'])
    router.delete(':id', [ComplaintsController, 'delete'])
    router.get('user/:utilisateur_id', [ComplaintsController, 'getUserComplaints'])
  })
  .prefix('complaints')

router
  .group(() => {
    router.get('/', [AdminController, 'index']).use([middleware.auth(), middleware.admin()])
    router.post('/', [AdminController, 'create']).use([middleware.auth(), middleware.admin()])
    router.get(':id', [AdminController, 'get']).use([middleware.auth(), middleware.admin()])
    router.put(':id', [AdminController, 'update']).use([middleware.auth(), middleware.admin()])
    router.delete(':id', [AdminController, 'delete']).use([middleware.auth(), middleware.admin()])
  })
  .prefix('admins')

router
  .group(() => {
    router.get('/', [ServicesController, 'index'])
    router.post('/', [ServicesController, 'create'])
    router.get(':id', [ServicesController, 'show'])
    router.put(':id', [ServicesController, 'update'])
    router.delete(':id', [ServicesController, 'delete'])
  })
  .prefix('services')

router
  .group(() => {
    router.post('create', [JustificationPiecesController, 'create'])
    router.get('all', [JustificationPiecesController, 'getAll'])
    router.get('unverified', [JustificationPiecesController, 'getUnverified'])
    router.get('verified', [JustificationPiecesController, 'getVerified'])
    router.get('user/:user_id', [JustificationPiecesController, 'getUserPieces'])
    router.put('verify/:id', [JustificationPiecesController, 'verify'])
    router.put('reject/:id', [JustificationPiecesController, 'reject'])
    router.get(':id', [JustificationPiecesController, 'get'])
  })
  .prefix('justification-pieces')

router
  .group(() => {
    router
      .get('livreur/:livreur_id/positions', [TrackingController, 'getLivreurPositions'])
      .use(middleware.auth())
    router
      .get('livreur/:livreur_id/last-position', [TrackingController, 'getLastPosition'])
      .use(middleware.auth())
    router
      .get('livraison/:livraison_id', [TrackingController, 'getLivraisonTracking'])
      .use(middleware.auth())
    router
      .get('active-livreurs', [TrackingController, 'getActiveLivreurs'])
      .use([middleware.auth(), middleware.admin()])
  })
  .prefix('tracking')
