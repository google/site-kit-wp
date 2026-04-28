/**
 * Site Kit by Google, Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

( ( jQuery ) => {
	// eslint-disable-next-line no-undef
	if ( ! jQuery ) {
		return;
	}

	const body = jQuery( 'body' );
	const currency = global._googlesitekit.easyDigitalDownloadsCurrency;

	body.on( 'edd_cart_item_added', ( event, details ) => {
		const value = parseAmount( details.total );
		const { id, name, price } = parseCartItemHTML( details.cart_item );

		global._googlesitekit?.gtagEvent?.( 'add_to_cart', {
			currency,
			value,
			items: [
				{
					item_id: id,
					item_name: name,
					price,
				},
			],
		} );
	} );

	if ( global._googlesitekit?.edddata?.purchase ) {
		global._googlesitekit?.gtagEvent?.( 'purchase', {
			currency,
			...global._googlesitekit.edddata.purchase,
		} );
	}
} )( global.jQuery );

/**
 * Parses the provided cart item HTML to extract product details.
 *
 * @since 1.153.0
 *
 * @param {string} cartItemHTML The HTML string for the cart item.
 * @return {Object} An object containing the item's `id`, `name` and `price`.
 */
export function parseCartItemHTML( cartItemHTML ) {
	const parser = new DOMParser();
	const doc = parser.parseFromString( cartItemHTML, 'text/html' );

	const id =
		// eslint-disable-next-line sitekit/acronym-case
		doc.querySelector( '.edd-remove-from-cart' )?.dataset.downloadId || '';
	const name =
		doc.querySelector( '.edd-cart-item-title' )?.textContent.trim() || '';
	const price =
		doc.querySelector( '.edd-cart-item-price' )?.textContent.trim() || '';

	return {
		id,
		name,
		price: parseAmount( price ),
	};
}

/**
 * Parses the provided amount string to a number.
 *
 * @since n.e.x.t
 *
 * @param {string} amount The amount string.
 * @return {number} The amount as a number.
 */
function parseAmount( amount ) {
	let normalizedNumericPrice = amount.replace( /[^\d.,]/g, '' ).trim();

	const lastComma = normalizedNumericPrice.lastIndexOf( ',' );
	const lastDot = normalizedNumericPrice.lastIndexOf( '.' );

	if ( lastComma > -1 && lastDot > -1 ) {
		// If both comma and dot are present and the last comma is after the last dot,
		// we assume the last comma is the decimal separator - and we remove dots and replace comma with dot.
		// Otherwise, we assume the last dot is the decimal separator and we remove commas.
		if ( lastComma > lastDot ) {
			normalizedNumericPrice = normalizedNumericPrice
				.replace( /\./g, '' )
				.replace( ',', '.' );
		} else {
			normalizedNumericPrice = normalizedNumericPrice.replace( /,/g, '' );
		}
	} else if ( lastComma > -1 ) {
		const commaDistanceFromEnd = normalizedNumericPrice.length - lastComma;
		// Assume comma is decimal separator if exactly 2 decimal digits follow.
		// Otherwise, remove comma.
		if ( commaDistanceFromEnd === 3 ) {
			normalizedNumericPrice = normalizedNumericPrice.replace( ',', '.' );
		} else {
			normalizedNumericPrice = normalizedNumericPrice.replace( /,/g, '' );
		}
	} else if ( lastDot > -1 ) {
		const dotDistanceFromEnd = normalizedNumericPrice.length - lastDot;
		if ( dotDistanceFromEnd !== 3 ) {
			normalizedNumericPrice = normalizedNumericPrice.replace(
				/\./g,
				''
			);
		}
	}

	return parseFloat( normalizedNumericPrice ) || 0;
}
