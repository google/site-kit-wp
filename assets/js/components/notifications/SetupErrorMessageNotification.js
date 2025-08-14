/**
 * SetupErrorMessageNotification component.
 *
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
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useCallback } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { useSelect, useRegistry } from 'googlesitekit-data';
import {
	CORE_USER,
	FORM_TEMPORARY_PERSIST_PERMISSION_ERROR,
} from '../../googlesitekit/datastore/user/constants';
import { CORE_SITE } from '../../googlesitekit/datastore/site/constants';
import { CORE_FORMS } from '../../googlesitekit/datastore/forms/constants';
import useViewContext from '../../hooks/useViewContext';
import BannerNotification, {
	TYPES,
} from '../../googlesitekit/notifications/components/layout/BannerNotification';
import { snapshotAllStores } from '../../googlesitekit/data/create-snapshot-store';

export default function SetupErrorMessageNotification( { Notification } ) {
	const id = 'setup_error';
	const viewContext = useViewContext();
	const isAuthenticated = useSelect( ( select ) =>
		select( CORE_USER ).isAuthenticated()
	);

	// These will be `null` if no errors exist.
	const setupErrorCode = useSelect( ( select ) =>
		select( CORE_SITE ).getSetupErrorCode()
	);
	const setupErrorMessage = useSelect( ( select ) =>
		select( CORE_SITE ).getSetupErrorMessage()
	);
	const temporaryPersistedPermissionsError = useSelect( ( select ) =>
		select( CORE_FORMS ).getValue(
			FORM_TEMPORARY_PERSIST_PERMISSION_ERROR,
			'permissionsError'
		)
	);
	const setupErrorRedoURL = useSelect( ( select ) => {
		if ( temporaryPersistedPermissionsError?.data ) {
			return select( CORE_USER ).getConnectURL( {
				additionalScopes:
					temporaryPersistedPermissionsError?.data?.scopes,
				redirectURL:
					temporaryPersistedPermissionsError?.data?.redirectURL ||
					global.location.href,
			} );
		} else if (
			setupErrorCode === 'access_denied' &&
			! temporaryPersistedPermissionsError?.data &&
			isAuthenticated
		) {
			return null;
		}

		return select( CORE_SITE ).getSetupErrorRedoURL();
	} );
	const errorTroubleshootingLinkURL = useSelect( ( select ) =>
		select( CORE_SITE ).getErrorTroubleshootingLinkURL( {
			code: setupErrorCode,
		} )
	);

	let title = __( 'Error connecting Site Kit', 'google-site-kit' );
	let ctaLabel = __( 'Redo the plugin setup', 'google-site-kit' );

	if ( setupErrorCode === 'access_denied' ) {
		title = __( 'Permissions Error', 'google-site-kit' );

		if ( temporaryPersistedPermissionsError?.data ) {
			ctaLabel = __( 'Grant permission', 'google-site-kit' );
		} else if (
			! temporaryPersistedPermissionsError?.data &&
			isAuthenticated
		) {
			ctaLabel = null;
		}
	}

	const registry = useRegistry();
	const snapshotCoreFormsStore = useCallback( async () => {
		if ( temporaryPersistedPermissionsError?.data ) {
			// Snapshot `CORE_FORMS` store to ensure the form data with current error data
			//  is retained across page navigations.
			await snapshotAllStores( registry );
		}
	}, [ temporaryPersistedPermissionsError, registry ] );

	const gaTrackingProps = {
		gaTrackingEventArgs: { category: `${ viewContext }_${ id }` },
	};

	return (
		<Notification { ...gaTrackingProps }>
			<BannerNotification
				notificationID={ id }
				title={ title }
				type={ TYPES.ERROR }
				description={ setupErrorMessage }
				ctaButton={
					setupErrorRedoURL && {
						label: ctaLabel,
						href: setupErrorRedoURL,
						onClick: snapshotCoreFormsStore,
					}
				}
				learnMoreLink={ {
					label: __( 'Get help', 'google-site-kit' ),
					href: errorTroubleshootingLinkURL,
				} }
			/>
		</Notification>
	);
}
