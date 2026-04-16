const passwordWords = [
  'beachparty',
  'sunsetvibes',
  'saltydance',
  'coconutchill',
  'poolmood',
  'seasplash',
  'islandgiggle',
  'tropifunny',
  'sandymagic',
  'reefparty',
  'wavebuddy',
  'mocktailfun',
  'flipflop',
  'moonbeach',
  'palmlaugh',
  'partycrab',
  'shorebreak',
  'happytide',
  'sunkissed',
  'lagoonjam',
] as const

const randomItem = <T,>(items: readonly T[]) => items[Math.floor(Math.random() * items.length)]

const randomDigits = () => Math.floor(1000 + Math.random() * 9000).toString()

export const generatePlayfulPassword = () => `${randomItem(passwordWords)}${randomDigits()}`
