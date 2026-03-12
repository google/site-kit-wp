/**
 * Setting utilities.
 *
 * Site Kit by Google, Copyright 2025 Google LLC
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
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Gets the formatted list of post types based on the `postTypes` slugs
 * stored in settings.
 *
 * @since 1.146.0
 *
 * @param {Array} postTypes    The `postTypes` setting value.
 * @param {Array} allPostTypes All available public postTypes.
 * @return {string} Formatted string of post types.
 */
export function getPostTypesString( postTypes, allPostTypes ) {
	if ( ! Array.isArray( postTypes ) || postTypes.length === 0 ) {
		return '';
	}

	if ( ! Array.isArray( allPostTypes ) || allPostTypes.length === 0 ) {
		return postTypes.join( ', ' );
	}

	const enabledPostTypes = allPostTypes.filter( ( postType ) =>
		postTypes.includes( postType.slug )
	);

	if ( enabledPostTypes.length === allPostTypes.length ) {
		return __( 'All post types', 'google-site-kit' );
	}

	return enabledPostTypes.map( ( postType ) => postType.label ).join( ', ' );
}

/**
 * Extracts the product IDs from the products array returned by the API.
 *
 * @since n.e.x.t
 *
 * @param {Array} products The products array from the publication.
 * @return {Array} Array of product ID names.
 */
export function getProductIDs( products ) {
	if ( ! products || ! Array.isArray( products ) ) {
		return [];
	}

	return products.reduce( ( ids, { name } ) => {
		if ( ! name ) {
			return ids;
		}

		return [ ...ids, name ];
	}, [] );
}

/**
 * Extracts the active payment option from the payment options object.
 *
 * @since n.e.x.t
 *
 * @param {Object} paymentOptions The payment options object from the publication.
 * @return {string} The active payment option key, or empty string if none found.
 */
export function getPaymentOption( paymentOptions ) {
	if ( ! paymentOptions ) {
		return '';
	}

	const paymentOption = Object.keys( paymentOptions ).find(
		( key ) => !! paymentOptions[ key ]
	);

	return paymentOption || '';
}

/**
 * Extracts the product ID from the name returned from the API, which is
 * in the format of `publicationID:productID`.
 *
 * @since 1.148.0
 *
 * @param {string} productID The full product ID name.
 * @return {string} The product ID label.
 */
export function getProductIDLabel( productID ) {
	if ( ! productID ) {
		return '';
	}

	const separatorIndex = productID.indexOf( ':' );

	if ( separatorIndex === -1 ) {
		return productID;
	}

	return productID.substring( separatorIndex + 1 );
}
