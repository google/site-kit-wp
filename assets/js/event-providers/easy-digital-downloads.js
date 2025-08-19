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

/**
 * Internal dependencies
 */
import { isFeatureEnabled } from '../features';

( ( jQuery ) => {
	// eslint-disable-next-line no-undef
	if ( ! jQuery ) {
		return;
	}

	const { easyDigitalDownloadsCurrency: currency, edddata } =
		global._googlesitekit || {};

	const body = jQuery( 'body' );

	// Handle add_to_cart events (existing functionality unchanged)
	body.on( 'edd_cart_item_added', ( event, details ) => {
		const { name, value } = parseCartItemHTML( details.cart_item );

		global._googlesitekit?.gtagEvent?.( 'add_to_cart', {
			currency,
			value,
			items: [
				{
					item_name: name,
					price: value,
				},
			],
		} );
	} );

	// Listen for EDD purchase completion events
	body.on( 'edd_complete_purchase', ( event, data ) => {
		global.console.log( '🎯 EDD Complete Purchase Event Fired:', {
			event,
			data,
			eventType: event.type,
			timestamp: new Date().toISOString(),
			currentPage: global.location.href,
			edddata: global._googlesitekit?.edddata,
		} );
	} );

	// Also listen for any other EDD events that might be relevant
	body.on( 'edd_purchase_complete', ( event, data ) => {
		global.console.log( '🎯 EDD Purchase Complete Event Fired:', {
			event,
			data,
			timestamp: new Date().toISOString(),
		} );
	} );

	// Listen for general purchase events
	body.on( 'purchase', ( event, data ) => {
		global.console.log( '🎯 Generic Purchase Event Fired:', {
			event,
			data,
			timestamp: new Date().toISOString(),
		} );
	} );

	// Handle Enhanced Conversions user data if available
	// This will only have data on the purchase completion page
	if ( isFeatureEnabled( 'gtagUserData' ) && edddata?.user_data ) {
		// User data is already normalized from PHP and available for use by other integrations
		global._googlesitekit.enhancedConversionsUserData = edddata.user_data;

		global.console.log(
			'✅ EDD Enhanced Conversions User Data Available:',
			{
				userData: global._googlesitekit.enhancedConversionsUserData,
				paymentID: edddata.payment_id,
				note: 'This data is only available on the purchase completion page',
			}
		);

		// Example: You could send this data to analytics with any conversion event
		// global._googlesitekit?.gtagEvent?.( 'conversion', {
		//     user_data: edddata.user_data
		// } );
	}

	// Listen for ALL EDD events to see what's available
	jQuery( document ).on( 'edd_checkout_complete', ( event, data ) => {
		global.console.log( '🎯 EDD Checkout Complete Event:', {
			event,
			data,
		} );
	} );

	jQuery( document ).on( 'edd_purchase_form_submit', ( event, data ) => {
		global.console.log( '🎯 EDD Purchase Form Submit Event:', {
			event,
			data,
		} );
	} );

	jQuery( document ).on( 'edd_payment_complete', ( event, data ) => {
		global.console.log( '🎯 EDD Payment Complete Event:', { event, data } );
	} );

	// Debug: Show what data is available
	global.console.log( 'EDD Event Provider loaded', {
		edddata,
		featureEnabled: isFeatureEnabled( 'gtagUserData' ),
		hasUserData: !! edddata?.user_data,
		currentPage: global.location.href,
		enabledFeatures: global?._googlesitekitBaseData?.enabledFeatures,
		note: 'Listening for EDD events: edd_complete_purchase, edd_purchase_complete, edd_checkout_complete, edd_payment_complete',
	} );
} )( global.jQuery );

/**
 * Parses the provided cart item HTML to extract product details.
 *
 * @since 1.153.0
 *
 * @param {string} cartItemHTML The HTML string for the cart item.
 * @return {Object} `title` and `value` keys.
 */
export function parseCartItemHTML( cartItemHTML ) {
	const parser = new DOMParser();
	const doc = parser.parseFromString( cartItemHTML, 'text/html' );

	const name =
		doc.querySelector( '.edd-cart-item-title' )?.textContent.trim() || '';
	const price =
		doc.querySelector( '.edd-cart-item-price' )?.textContent.trim() || '';

	let normalizedNumericPrice = price.replace( /[^\d.,]/g, '' ).trim();

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

	const value = parseFloat( normalizedNumericPrice ) || 0;

	return {
		name,
		value,
	};
}
