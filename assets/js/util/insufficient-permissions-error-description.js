/**
 * getInsufficientPermissionsErrorDescription function.
 *
 * Site Kit by Google, Copyright 2020 Google LLC
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
import { __, _x, sprintf } from '@wordpress/i18n';

/**
 * Gets a description for an insufficient permissions error.
 *
 * @since n.e.x.t
 *
 * @param {string} error Original error message.
 * @param {string} moduleName Module name.
 * @param {string} ownerName Module owner name.
 * @return {string} Error description.
 */
export function getInsufficientPermissionsErrorDescription( error, moduleName, ownerName ) {
	let message = '';
	let userInfo = '';

	if ( _x( 'Analytics', 'Service name', 'google-site-kit' ) === moduleName ) {
		if ( error.match( /account/i ) ) {
			message = __( `Your Google account does not have sufficient permissions for this Analytics account, so you won't be able to see stats from it on the Site Kit dashboard.`, 'google-site-kit' );
		} else if ( error.match( /property/i ) ) {
			message = __( `Your Google account does not have sufficient permissions for this Analytics property, so you won't be able to see stats from it on the Site Kit dashboard.`, 'google-site-kit' );
		} else if ( error.match( /view/i ) ) {
			message = __( `Your Google account does not have sufficient permissions for this Analytics view, so you won't be able to see stats from it on the Site Kit dashboard.`, 'google-site-kit' );
		}
	} else if ( _x( 'Search Console', 'Service name', 'google-site-kit' ) === moduleName ) {
		message = __( `Your Google account does not have sufficient permissions for this Search Console property, so you won't be able to see stats from it on the Site Kit dashboard.`, 'google-site-kit' );
	}

	if ( ! message ) {
		message = sprintf(
			/* translators: %s: module name */
			__( `Your Google account does not have sufficient permissions for this %s data, so you won't be able to see stats from it on the Site Kit dashboard.`, 'google-site-kit' ),
			moduleName,
		);
	}

	if ( ownerName ) {
		userInfo = sprintf(
			/* translators: %s: owner name */
			__( 'This service was originally connected by the administrator "%s" — you can contact them for more information.', 'google-site-kit' ),
			ownerName,
		);
	}

	if ( ! userInfo ) {
		userInfo = __( 'This service was originally connected by an administrator — you can contact them for more information.', 'google-site-kit' );
	}

	return `${ message } ${ userInfo }`.trim();
}
