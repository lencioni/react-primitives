const prefixAll = require('inline-style-prefix-all');
const processTransform = require('./processTransform');
const normalizeValue = require('./normalizeValue');
const expandStyle = require('./expandStyle');
const hyphenate = require('./hyphenate');
const mapKeyValue = require('../util/mapKeyValue');

const normalizeStyle = style => prefixAll(processTransform(expandStyle(style)));

/**
 * Generates valid CSS rule bodies (sans selector) from a JS object
 *
 * Example:
 * ```
 * generateCss({ width: 20, color: 'blue' });
 * //=> 'width:20px;color:blue;'
 * ```
 *
 * @param style
 */
const generateCss = style => mapKeyValue(normalizeStyle(style), (key, val) => {
  const name = hyphenate(key);
  const value = normalizeValue(key, val);
  return `${name}:${value};`;
}).join('');

module.exports = generateCss;
