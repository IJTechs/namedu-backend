import { IAdmin } from './../interfaces/admin.interface'

declare global {
  namespace Express {
    interface Request {
      admin?: IAdmin
    }
  }
}
