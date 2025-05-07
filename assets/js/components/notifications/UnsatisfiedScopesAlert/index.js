/**
 * UnsatisfiedScopesAlert component.
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
 * External dependencies
 */
import { useMount } from 'react-use';

/**
 * WordPress dependencies
 */
import { useCallback, useRef, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { useDispatch, useSelect } from 'googlesitekit-data';
import { getItem } from '../../../googlesitekit/api/cache';
import { CORE_FORMS } from '../../../googlesitekit/datastore/forms/constants';
import { CORE_LOCATION } from '../../../googlesitekit/datastore/location/constants';
import { CORE_MODULES } from '../../../googlesitekit/modules/datastore/constants';
import { CORE_SITE } from '../../../googlesitekit/datastore/site/constants';
import {
	CORE_USER,
	FORM_TEMPORARY_PERSIST_PERMISSION_ERROR,
} from '../../../googlesitekit/datastore/user/constants';
import NotificationError from '../../../googlesitekit/notifications/components/layout/NotificationError';
import Description from '../../../googlesitekit/notifications/components/common/Description';
import CTALink from '../../../googlesitekit/notifications/components/common/CTALink';
import { getUnsatisfiedScopesMessage } from './utils';

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
	const modules = useSelect( ( select ) =>
		select( CORE_MODULES ).getModules()
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

	const { title, message, ctaLabel } = getUnsatisfiedScopesMessage(
		unsatisfiedScopes,
		modules,
		temporaryPersistedPermissionsError
	);

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
