// @ts-nocheck
import swagger from 'adonis-autoswagger'
import swaggerConfig from '../../config/swagger.js'

export default class SwaggerController {
  async getJSON({ response }) {
    return response.json(
      swagger.default.json({
        ...swaggerConfig,
        snakeCase: false,
        ignore: [],
      })
    )
  }

  async getUI({ response }) {
    return swagger.default.ui(response, {
      ...swaggerConfig,
      snakeCase: false,
      ignore: [],
    })
  }
}
