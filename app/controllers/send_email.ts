import type { HttpContext } from '@adonisjs/core/http'
import { sendEmailValidator } from '#validators/send_email'
import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY!)

export default class Email{
    async sendEmail({ request, response }: HttpContext) {
        const { to, subject, body } = await request.validateUsing(sendEmailValidator)

        try {
            const data = await resend.emails.send({
                from: process.env.RESEND_FROM_EMAIL || "noreplyecodeli@gmail.com",
                to,
                subject,
                html: body,
            })
            return response.ok({ success: true, data })
        } catch (error) {
            console.error("✉️ send-email error:", error)
            return response.status(500).send({ message: "The email sending has encountered an error", error: error })
        }
    }
}