export const formatPhoneNumber = (phoneNumber: string, type: 'group' | 'individual' = 'individual') => {
  const suffixes = {
    individual: '@s.whatsapp.net',
    group: '@g.us',
  }

  const nonDigitsRegexp = /\D/g
  phoneNumber = phoneNumber.replace(nonDigitsRegexp, '')

  Object.values(suffixes).forEach(suffix => {
    if (phoneNumber.endsWith(suffix)) {
      return phoneNumber
    }
  })

  return `${phoneNumber}${suffixes[type]}`
}
