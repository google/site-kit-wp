/**
 * UnsatisfiedScopesAlert component.
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
import { uniq } from 'lodash';
import { useMount } from 'react-use';

/**
 * WordPress dependencies
 */
import { useCallback, useRef, useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { useDispatch, useSelect } from 'googlesitekit-data';
import { listFormat } from '../../util';
import { getItem } from '../../googlesitekit/api/cache';
import { CORE_FORMS } from '../../googlesitekit/datastore/forms/constants';
import { CORE_LOCATION } from '../../googlesitekit/datastore/location/constants';
import { CORE_MODULES } from '../../googlesitekit/modules/datastore/constants';
import { CORE_SITE } from '../../googlesitekit/datastore/site/constants';
import {
	CORE_USER,
	FORM_TEMPORARY_PERSIST_PERMISSION_ERROR,
} from '../../googlesitekit/datastore/user/constants';
import NotificationError from '../../googlesitekit/notifications/components/layout/NotificationError';
import Description from '../../googlesitekit/notifications/components/common/Description';
import CTALink from '../../googlesitekit/notifications/components/common/CTALink';

// Map of scope IDs to Site Kit module slugs.
const scopeIDToSlug = {
	siteverification: 'site-verification',
	webmasters: 'search-console',
	analytics: 'analytics-4',
};
const MESSAGE_MULTIPLE = 'multiple';
const MESSAGE_SINGULAR = 'single';
const MESSAGE_GENERIC = 'generic';

/**
 * Maps unsatisfied scopes to module names.
 *
 * @since 1.39.0
 *
 * @param {Array}  scopes  Array of unsatisfied scopes.
 * @param {Object} modules Object of all modules.
 * @return {Array} Array of module names. If a scope does not map to a module, it is set to `false`.
 */
function mapScopesToModuleNames( scopes, modules ) {
	if ( modules === undefined ) {
		return null;
	}

	return (
		scopes
			// Map into an array of matches.
			.map( ( scope ) =>
				scope.match(
					new RegExp(
						'^https://www\\.googleapis\\.com/auth/([a-z]+)'
					)
				)
			)
			// Map each match into a module slug, if any.
			.map( ( [ , id ] ) => scopeIDToSlug[ id ] || id )
			// Map module slugs into module names. If there is no matched module, set to `false`.
			.map( ( slug ) => modules[ slug ]?.name || false )
	);
}

export default function UnsatisfiedScopesAlert( { id, Notification } ) {
	const doingCTARef = useRef();

	const [ inProgressModuleSetup, setInProgressModuleSetup ] =
		useState( false );

	const isNavigating = useSelect( ( select ) =>
		select( CORE_LOCATION ).isNavigatingTo(
			new RegExp( '//oauth2|action=googlesitekit_connect', 'i' )
		)
	);
	const temporaryPersistedPermissionsError = useSelect( ( select ) =>
		select( CORE_FORMS ).getValue(
			FORM_TEMPORARY_PERSIST_PERMISSION_ERROR,
			'permissionsError'
		)
	);
	const unsatisfiedScopes = useSelect( ( select ) =>
		select( CORE_USER ).getUnsatisfiedScopes()
	);

	const connectURLData = temporaryPersistedPermissionsError?.data
		? {
				additionalScopes:
					temporaryPersistedPermissionsError.data?.scopes,
				redirectURL:
					temporaryPersistedPermissionsError.data?.redirectURL ||
					global.location.href,
		  }
		: {
				redirectURL: global.location.href,
		  };

	const connectURL = useSelect( ( select ) =>
		select( CORE_USER ).getConnectURL( connectURLData )
	);

	const modules = useSelect( ( select ) =>
		select( CORE_MODULES ).getModules()
	);

	const { activateModule } = useDispatch( CORE_MODULES );
	const { navigateTo } = useDispatch( CORE_LOCATION );
	const { setInternalServerError } = useDispatch( CORE_SITE );

	// Fetch the module setup in progress from cache.
	useMount( async () => {
		const { cacheHit, value } = await getItem( 'module_setup' );

		if ( cacheHit ) {
			setInProgressModuleSetup( value );
		}
	} );

	const onCTAClick = useCallback( async () => {
		doingCTARef.current = true;

		if ( ! inProgressModuleSetup ) {
			return;
		}

		const { error, response } = await activateModule(
			inProgressModuleSetup
		);

		if ( ! error ) {
			navigateTo( response.moduleReauthURL );
		} else {
			setInternalServerError( {
				id: 'activate-module-error',
				description: error.message,
			} );
		}
	}, [
		activateModule,
		inProgressModuleSetup,
		navigateTo,
		setInternalServerError,
	] );

	// Some external scenarios where we navigate to the OAuth service or connect URL may coincide with a request which populates the
	// list of unsatisfied scopes. In these scenarios we want to avoid showing this banner as the user is already being directed to
	// address the missing scopes. However, we want to ensure we still do show this banner while navigating to the connect URL as a
	// result of its own CTA.
	if (
		( isNavigating && ! doingCTARef.current ) ||
		! unsatisfiedScopes?.length ||
		connectURL === undefined
	) {
		return null;
	}

	let messageID;
	let moduleNames;
	if (
		// Determine if all scopes are in Google API format, otherwise use generic message.
		unsatisfiedScopes.some(
			( scope ) =>
				! scope.match(
					new RegExp( '^https://www\\.googleapis\\.com/auth/' )
				)
		)
	) {
		messageID = MESSAGE_GENERIC;
	} else {
		// All scopes are in Google API format, map them to module names.
		moduleNames = mapScopesToModuleNames( unsatisfiedScopes, modules );
		// If any scope did not resolve to a module name, use the generic message.
		if ( ! moduleNames || moduleNames.some( ( name ) => name === false ) ) {
			messageID = MESSAGE_GENERIC;
		} else {
			moduleNames = uniq( moduleNames );
			messageID =
				1 < moduleNames.length ? MESSAGE_MULTIPLE : MESSAGE_SINGULAR;
		}
	}

	let message;
	const title = __(
		'Site Kit can’t access necessary data',
		'google-site-kit'
	);
	const ctaLabel = temporaryPersistedPermissionsError?.data
		? __( 'Grant permission', 'google-site-kit' )
		: __( 'Redo setup', 'google-site-kit' );

	switch ( messageID ) {
		case MESSAGE_MULTIPLE:
			message = sprintf(
				/* translators: %s: List of product names */
				__(
					'Site Kit can’t access all relevant data because you haven’t granted all permissions requested during setup. To use Site Kit, you’ll need to redo the setup for: %s – make sure to approve all permissions at the authentication stage.',
					'google-site-kit'
				),
				listFormat( moduleNames )
			);
			break;
		case MESSAGE_SINGULAR:
			message = sprintf(
				/* translators: %s: Product name */
				__(
					'Site Kit can’t access the relevant data from %1$s because you haven’t granted all permissions requested during setup. To use Site Kit, you’ll need to redo the setup for %1$s – make sure to approve all permissions at the authentication stage.',
					'google-site-kit'
				),
				moduleNames[ 0 ]
			);
			break;
		case MESSAGE_GENERIC:
			message = __(
				'Site Kit can’t access all relevant data because you haven’t granted all permissions requested during setup. To use Site Kit, you’ll need to redo the setup – make sure to approve all permissions at the authentication stage.',
				'google-site-kit'
			);
			break;
	}

	return (
		<Notification className="googlesitekit-publisher-win googlesitekit-publisher-win--win-error">
			<NotificationError
				title={ title }
				description={ <Description text={ message } /> }
				actions={
					<CTALink
						id={ id }
						ctaLabel={ ctaLabel }
						ctaLink={
							inProgressModuleSetup ? undefined : connectURL
						}
						onCTAClick={ onCTAClick }
					/>
				}
			/>
		</Notification>
	);
}
