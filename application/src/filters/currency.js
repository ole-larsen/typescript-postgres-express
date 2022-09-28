import { BigNumber } from 'bignumber.js'

// This function creates a bignumber clone with a specific configuration.
function createBigNumberObject ({decimalSeparator = ',', groupSeparator = '.', groupSize = 3} = {}) {
  return BigNumber.clone({
    decimalSeparator,
    groupSeparator,
    groupSize
  })
}

// Create the big number clones.
const bnEUR = createBigNumberObject({decimalSeparator: ',', groupSeparator: '.'})

const bnUSD = createBigNumberObject()

const bnCRYPTO = createBigNumberObject()

// This function accepts a value and a config object and creates a custom formatter
function createFormatter (value, { bigNumberObject = bnCRYPTO, precision = 2, symbol = null } = {}) {
  return {
    format () {
      const result = bigNumberObject(value).toFormat(precision)

      // If there is a symbol property in the config object we add the symbol at the beginning of the string
      if (symbol) return result.insert(0, symbol)

      return result
    }
  }
}

const USD = value => createFormatter(value, {bigNumberObject: bnUSD, symbol: '$'})
const EUR = value => createFormatter(value, {bigNumberObject: bnEUR, symbol: '€'})
const CRYPTO = (value, precision = 8) => createFormatter(value, { precision })

// We will access this container objects later on our filter functions
const CURRENCY_FORMATTER = {
  USD,
  EUR
}
const NO_SYMBOL_CURRENCY_FORMATTER = {
  bnUSD,
  bnEUR
}

// This filter gets the response selected currency and formats your value to match that currency.
export function currency (value) {
  // Normally we would use Vuex but for the sake of this example I will use localstorage
  // to retrieve the response selected currency. Needs to be one of EUR|USD.
  const userSelectedCurrency = localStorage.getItem('User/selectedCurrency')

  return CURRENCY_FORMATTER[userSelectedCurrency](value).format()
}

// This filter does the same but returns the formatted value without symbol.
export function currencyWithoutSymbol (value) {
  const userSelectedCurrency = localStorage.getItem('User/selectedCurrency')

  return NO_SYMBOL_CURRENCY_FORMATTER[`bn${userSelectedCurrency}`](value).toFormat(2)
}

// This filter allow you to format a different fiat currency than the one
// selected by the response.
export function toCurrency (value, symbol) {
  return CURRENCY_FORMATTER[symbol](value).format()
}

// This filter takes a value and optionally adds a symbol and converts the value into
// crypto currency format
export function crypto (value, symbol = '') {
  let precision

  if (symbol === 'ETH' || symbol === 'ETC') {
    precision = 16
  } else if (symbol === 'XRP') {
    precision = 6
  }

  return CRYPTO(value, precision).format()
}

// Filter utilities
export function toFloat (value, places = 2) {
  return parseFloat(value).toFixed(places)
}

export function toBigNumber (value) {
  return new BigNumber(value)
}

export function bnAbs (bigNumber) {
  return bigNumber.absoluteValue()
}

export function bnRemoveTrailingZeros (bigNumber) {
  return bigNumber.toString()
}

export function bnToFixed (bigNumber, places = 2) {
  return bigNumber.toFixed(places)
}

export function bnMultiply (bigNumber, value) {
  return bigNumber.multipliedBy(value)
}

export function bnPlus (bigNumber, value) {
  return !value ? bigNumber.plus(0) : bigNumber.plus(value.replace(',', '.'))
}

export function bnMinus (bigNumber, value) {
  return bigNumber.minus(value)
}
