import { config } from '../config/environments.config'

export const disableConsole = () => {
  if (config.NODE_ENV === 'production') {
    console.log = () => {}
    console.error = () => {}
    console.warn = () => {}
  }
}
