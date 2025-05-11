import type { HttpContext } from '@adonisjs/core/http'

export default class FilesController {
  public async upload({ request }: HttpContext) {
    const file = request.file('file', {
      size: '10mb',
      extnames: ['jpg', 'png', 'pdf'],
    })

    if (!file) {
      return { status: 'error', message: 'No file provided' }
    }

    const fileName = `${Date.now()}_${file.clientName}`
    await file.moveToDisk('./', 's3', { name: fileName })

    return { status: 'success', message: 'File uploaded', fileName }
  }
}
