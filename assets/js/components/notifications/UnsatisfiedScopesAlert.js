/**
 * DashboardAuthAlert component.
 *
 * Site Kit by Google, Copyright 2021 Google LLC
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
 * External dependencies
 */
import unique from 'lodash/uniq';

/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import Notification from '../legacy-notifications/notification';
import { getModulesData, listFormat } from '../../util';
import { CORE_USER } from '../../googlesitekit/datastore/user/constants';
import { CORE_LOCATION } from '../../googlesitekit/datastore/location/constants';
const { useSelect } = Data;

// Map of scope IDs to Site Kit module slugs.
const scopeIDToSlug = {
	siteverification: 'site-verification',
	webmasters: 'search-console',
};
const MESSAGE_MULTIPLE = 'multiple';
const MESSAGE_SINGULAR = 'single';
const MESSAGE_GENERIC = 'generic';

function mapScopesToModuleNames( scopes ) {
	const modules = getModulesData();

	return scopes
		// Map into an array of matches.
		.map( ( scope ) => scope.match( /^https:\/\/www.googleapis.com\/auth\/([a-z]+)/ ) )
		// Map each match into a module slug, if any.
		.map( ( [ , id ] ) => scopeIDToSlug[ id ] || id )
		// Map module slugs into module names. If there is no matched module, set to `false`.
		.map( ( slug ) => modules[ slug ]?.name || false )
	;
}

export default function UnsatisfiedScopesAlert() {
	const isNavigating = useSelect( ( select ) => select( CORE_LOCATION ).isNavigatingTo( /(\/o\/oauth2)|(action=googlesitekit_connect)/i ) );
	const unsatisfiedScopes = useSelect( ( select ) => select( CORE_USER ).getUnsatisfiedScopes() );
	const connectURL = useSelect( ( select ) => select( CORE_USER ).getConnectURL( {
		redirectURL: global.location.href,
	} ) );

	if ( isNavigating || ! unsatisfiedScopes?.length || connectURL === undefined ) {
		return null;
	}

	let messageID;
	let moduleNames;
	// Determine if all scopes are in Google API format, otherwise use generic message.
	if ( unsatisfiedScopes.some( ( scope ) => ! scope.match( /^https:\/\/www.googleapis.com\/auth\// ) ) ) {
		messageID = MESSAGE_GENERIC;
	} else {
		// All scopes are in Google API format, map them to module names.
		moduleNames = mapScopesToModuleNames( unsatisfiedScopes );
		// If any scope did not resolve to a module name, use the generic message.
		if ( moduleNames.some( ( name ) => name === false ) ) {
			messageID = MESSAGE_GENERIC;
		} else {
			moduleNames = unique( moduleNames );
			messageID = 1 < moduleNames.length ? MESSAGE_MULTIPLE : MESSAGE_SINGULAR;
		}
	}

	let message;

	switch ( messageID ) {
		case MESSAGE_MULTIPLE:
			message = sprintf(
				/* translators: %s: List of product names */
				__( 'Site Kit can’t access all relevant data because you haven’t granted all permissions requested during setup. To use Site Kit, you’ll need to redo the setup for: %s – make sure to approve all permissions at the authentication stage.', 'google-site-kit' ),
				listFormat( moduleNames )
			);
			break;
		case MESSAGE_SINGULAR:
			message = sprintf(
				/* translators: %1$s: Product name */
				__( 'Site Kit can’t access the relevant data from %1$s because you haven’t granted all permissions requested during setup. To use Site Kit, you’ll need to redo the setup for %1$s – make sure to approve all permissions at the authentication stage.', 'google-site-kit' ),
				moduleNames[ 0 ]
			);
			break;
		case MESSAGE_GENERIC:
			message = __( 'Site Kit can’t access all relevant data because you haven’t granted all permissions requested during setup. To use Site Kit, you’ll need to redo the setup – make sure to approve all permissions at the authentication stage.', 'google-site-kit' );
			break;
	}

	return (
		<Notification
			id="authentication error"
			title={ __( 'Site Kit can’t access necessary data', 'google-site-kit' ) }
			description={ message }
			format="small"
			type="win-error"
			isDismissable={ false }
			ctaLink={ connectURL }
			ctaLabel={ __( 'Redo setup', 'google-site-kit' ) }
		/>
	);
}
