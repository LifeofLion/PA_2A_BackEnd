import type { HttpContext } from '@adonisjs/core/http'
import CodeTemporaire from '#models/code_temporaire'
import { generateCodeValidator } from '#validators/generate_code'
import { checkCodeValidator } from '#validators/check_code'

export default class CodeTemporairesController {
    async generate_code({ request, response }: HttpContext) {
        const { user_info } = await request.validateUsing(generateCodeValidator)
        const userExists = await CodeTemporaire.query()
            .where('user_info', user_info)
            .first()

        if (userExists) {
            return response.badRequest({ error_message: 'Code already exists for this user' })
        }

        const code = Math.floor(100000 + Math.random() * 900000).toString()

        try {
            await CodeTemporaire.create({ user_info, code })
            return response.ok({ message: 'Code created successfully', code: code })
        } catch (error) {
            return response.badRequest({ error_message: 'Failed to create code', error })
        }
    }

    async check_code({ request, response }: HttpContext) {
        try {
            const { user_info, code } = await request.validateUsing(checkCodeValidator)
            const codeTemporaire = await CodeTemporaire.query()
                .where('user_info', user_info)
                .where('code', code)
                .first()

            if (codeTemporaire) {
                await CodeTemporaire.query()
                    .where('user_info', user_info)
                    .where('code', code)
                    .delete()
                return response.ok({ message: 'Code is valid' })
            } else {
                return response.badRequest({ error_message: 'Invalid code' })
            }
        } catch (error) {
            return response.badRequest({ error_message: 'Failed to check code', error: error })
        }
    }

    async reset_code({ request, response }: HttpContext) {
        try {
            const { user_info } = await request.validateUsing(generateCodeValidator)
            const codeTemporaire = await CodeTemporaire.query()
                .where('user_info', user_info)
                .first()

            if (codeTemporaire) {                    
                const code = Math.floor(100000 + Math.random() * 900000).toString()
                await CodeTemporaire.query()
                    .where('user_info', user_info)
                    .update({ code: code })
                return response.ok({ message: 'Code reset successfully', code: code })
            } else {
                return response.badRequest({ error_message: 'No code found for this user' })
            }
        } catch (error) {
            return response.badRequest({ error_message: 'Failed to reset code', error: error })
        }
    }
}