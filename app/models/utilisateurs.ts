import { DateTime } from 'luxon'
import hash from '@adonisjs/core/services/hash'
import { BaseModel, column, hasMany, hasOne } from '@adonisjs/lucid/orm'
import type { HasMany, HasOne } from '@adonisjs/lucid/types/relations'
import { withAuthFinder } from '@adonisjs/auth/mixins/lucid'
import { DbAccessTokensProvider } from '@adonisjs/auth/access_tokens'
import { compose } from '@adonisjs/core/helpers'
import Annonce from '#models/annonce'
import Admin from '#models/admin'
import Client from '#models/client'
import Livreur from '#models/livreur'
import Prestataire from '#models/prestataire'
import JustificationPiece from '#models/justification_piece'

const AuthFinder = withAuthFinder(() => hash.use('scrypt'), {
  uids: ['email'],
  passwordColumnName: 'password',
})

export default class Utilisateurs extends compose(BaseModel, AuthFinder) {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare first_name: string

  @column()
  declare last_name: string

  @column()
  declare address: string | null

  @column()
  declare city: string

  @column({ columnName: 'postal_code' })
  declare postalCode: string

  @column()
  declare country: string

  @column()
  declare phone_number: string | null

  @column()
  declare state: string

  @column()
  declare email: string

  @column({ serializeAs: null })
  declare password: string

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @hasMany(() => Annonce, { foreignKey: 'utilisateur_id' })
  declare annonces: HasMany<typeof Annonce>

  @hasOne(() => Admin, { foreignKey: 'id' })
  declare admin: HasOne<typeof Admin>

  @hasOne(() => Client, { foreignKey: 'id' })
  declare client: HasOne<typeof Client>

  @hasOne(() => Livreur, { foreignKey: 'id' })
  declare livreur: HasOne<typeof Livreur>

  @hasOne(() => Prestataire, { foreignKey: 'id' })
  declare prestataire: HasOne<typeof Prestataire>

  @hasMany(() => JustificationPiece, { foreignKey: 'utilisateur_id' })
  declare justificationPieces: HasMany<typeof JustificationPiece>

  static accessTokens = DbAccessTokensProvider.forModel(Utilisateurs)
}
