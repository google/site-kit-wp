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

/**
 * Internal dependencies
 */
import { useSelect } from 'googlesitekit-data';
import {
	CORE_USER,
	FORM_TEMPORARY_PERSIST_PERMISSION_ERROR,
} from '../../googlesitekit/datastore/user/constants';
import { CORE_SITE } from '../../googlesitekit/datastore/site/constants';
import { CORE_FORMS } from '../../googlesitekit/datastore/forms/constants';
import NotificationError from '../../googlesitekit/notifications/components/layout/NotificationError';
import Description from '../../googlesitekit/notifications/components/common/Description';
import LearnMoreLink from '../../googlesitekit/notifications/components/common/LearnMoreLink';
import CTALink from '../../googlesitekit/notifications/components/common/CTALink';
import useViewContext from '../../hooks/useViewContext';

export default function SetupErrorMessageNotification( { Notification } ) {
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

	const gaTrackingProps = {
		gaTrackingEventArgs: { category: `${ viewContext }_setup_error` },
	};

	return (
		<Notification
			{ ...gaTrackingProps }
			className="googlesitekit-publisher-win googlesitekit-publisher-win--win-error"
		>
			<NotificationError
				title={ title }
				description={
					<Description
						text={ setupErrorMessage }
						learnMoreLink={
							<LearnMoreLink
								id="setup_error"
								label={ __( 'Get help', 'google-site-kit' ) }
								url={ errorTroubleshootingLinkURL }
							/>
						}
					/>
				}
				actions={
					setupErrorRedoURL && (
						<CTALink
							id="setup_error"
							ctaLabel={ ctaLabel }
							ctaLink={ setupErrorRedoURL }
						/>
					)
				}
			/>
		</Notification>
	);
}
