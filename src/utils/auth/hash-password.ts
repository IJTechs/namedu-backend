const bcrypt = require('bcrypt')

const hashePassword = async (password: string) => {
  const salt = await bcrypt.genSalt(12)
  return bcrypt.hash(password, salt)
}

export default hashePassword
