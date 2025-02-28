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
 * Extracts the product ID from the name returned from the API, which is
 * in the format of `publicationID:productID`.
 *
 * @since n.e.x.t
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
