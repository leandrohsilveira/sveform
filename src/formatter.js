export function createFormatter(locale, options) {
  const formatter = new Intl.NumberFormat(locale, {
    maximumFractionDigits: 16,
    ...(options ?? {}),
    useGrouping:
      typeof Intl.NumberFormat.prototype.formatToParts === 'function',
  })

  /** @type {Map<Intl.NumberFormatPart['type'], string>} */
  const map = new Map()

  if (typeof Intl.NumberFormat.prototype.formatToParts === 'function') {
    const parts = formatter.formatToParts(123456789.12)
    parts.forEach(part => map.set(part.type, part.value))
  } else {
    const opts = formatter.resolvedOptions()
    const sample = formatter.format(1.1)
    const fractionIndex = (() => {
      if (opts.maximumFractionDigits > 0) {
        const fractionDigitsCount =
          opts.minimumFractionDigits > 1 ? opts.minimumFractionDigits : 1
        return sample.length - fractionDigitsCount - 1
      }
      return undefined
    })()
    if (fractionIndex !== undefined) map.set('decimal', sample[fractionIndex])
  }

  const entries = Array.from(map.entries())

  /**
   * @param {string} val
   * @param {string | undefined} str
   * @param {string} subst
   * @returns {string}
   */
  function replace(val, str, subst) {
    if (str !== undefined) {
      return val.replace(new RegExp(`\\${str}`, 'g'), subst)
    }
    return val
  }

  return {
    decimal: map.get('decimal'),

    /**
     * @overload
     * @param {string} value
     * @returns {string}
     *//**
     * @overload
     * @param {string | undefined} value
     * @returns {string | undefined}
     *//**
     * @param {string | undefined} value
     * @returns {string | undefined}
     */
    unformat(value) {
      if (value !== undefined) {
        return entries.reduce((acc, [type, typeValue]) => {
          switch (type) {
            case 'fraction':
            case 'integer':
            case 'plusSign':
            case 'minusSign':
              return acc
            case 'decimal':
              return replace(acc, typeValue, '.')
            case 'group':
            default:
              return replace(acc, typeValue, '')
          }
        }, value)
      }
    },

    /**
     * @param {string | undefined} value
     * @returns {string}
     */
    format(value) {
      if (value !== undefined && value !== '' && !Number.isNaN(+value))
        return formatter.format(+value)
      return ''
    },
  }
}
