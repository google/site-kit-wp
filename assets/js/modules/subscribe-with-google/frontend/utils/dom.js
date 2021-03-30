/**
 * Selects a single DOM element.
 *
 * @since 1.29.0
 *
 * @param {string} selector Specifies an element.
 * @return {Element} Single DOM element.
 */
export const $ = ( selector ) => document.querySelector( selector );

/**
 * Selects one or more DOM elements.
 *
 * @since 1.29.0
 *
 * @param {string} selector Specifies one or more elements.
 * @return {Element[]} One or more DOM elements.
 */
export const $$ = ( selector ) => [ ...document.querySelectorAll( selector ) ];
