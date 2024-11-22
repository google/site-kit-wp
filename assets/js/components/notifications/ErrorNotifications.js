/**
 * ErrorNotifications component.
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
 * WordPress dependencies
 */
import { Fragment } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { useSelect } from 'googlesitekit-data';
import AuthError from './AuthError';
import InternalServerError from './InternalServerError';
import {
	CORE_USER,
	FORM_TEMPORARY_PERSIST_PERMISSION_ERROR,
} from '../../googlesitekit/datastore/user/constants';
import { CORE_SITE } from '../../googlesitekit/datastore/site/constants';
import { CORE_FORMS } from '../../googlesitekit/datastore/forms/constants';
import BannerNotification from './BannerNotification';
import Notifications from './Notifications';
import { NOTIFICATION_AREAS } from '../../googlesitekit/notifications/datastore/constants';

export default function ErrorNotifications() {
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

	if (
		temporaryPersistedPermissionsError?.data?.skipDefaultErrorNotifications
	) {
		return null;
	}

	return (
		<Fragment>
			<InternalServerError />
			<AuthError />
			{ setupErrorMessage && (
				<BannerNotification
					id="setup_error"
					type="win-error"
					title={ title }
					description={ setupErrorMessage }
					isDismissible={ false }
					ctaLink={ setupErrorRedoURL }
					ctaLabel={ ctaLabel }
					learnMoreLabel={ __( 'Get help', 'google-site-kit' ) }
					learnMoreURL={ errorTroubleshootingLinkURL }
				/>
			) }
			<Notifications areaSlug={ NOTIFICATION_AREAS.ERRORS } />
		</Fragment>
	);
}
