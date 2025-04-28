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

	body.on( 'edd_cart_item_added', function ( event, details ) {
		const { title, value } = parseCartItemHTML( details.cart_item );
		const currency = global._googlesitekit.eddCurrency;

		global._googlesitekit?.gtagEvent?.( 'add_to_cart', {
			currency,
			value,
			items: [
				{
					item_name: title,
					price: value,
				},
			],
		} );
	} );
} )( global.jQuery );

/**
 * Parses the provided cart item HTML to extract product details.
 *
 * @since n.e.x.t
 *
 * @param {string} cartItemHTML The HTML string for the cart item.
 * @return {Object} `title` and `value` keys.
 */
export const parseCartItemHTML = ( cartItemHTML ) => {
	const parser = new DOMParser();
	const doc = parser.parseFromString( cartItemHTML, 'text/html' );

	const title =
		doc.querySelector( '.edd-cart-item-title' )?.textContent.trim() || '';
	const priceText =
		doc.querySelector( '.edd-cart-item-price' )?.textContent.trim() || '';

	const priceRegex = /([\d,.]+)/;
	const match = priceText.match( priceRegex );
	const value = match ? parseFloat( match[ 1 ].replace( /,/g, '' ) ) : 0;

	return {
		title,
		value,
	};
};
