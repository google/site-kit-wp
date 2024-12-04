/**
 * FirstPartyModeSetupSuccessSubtleNotification component.
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
 * External dependencies
 */
import PropTypes from 'prop-types';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { CORE_MODULES } from '../../googlesitekit/modules/datastore/constants';
import SubtleNotification from '../../googlesitekit/notifications/components/layout/SubtleNotification';
import Dismiss from '../../googlesitekit/notifications/components/common/Dismiss';
import { useSelect } from 'googlesitekit-data';

export const FIRST_PARTY_MODE_SETUP_SUCCESS_NOTIFICATION =
	'setup-success-notification-fpm';

export default function FirstPartyModeSetupSuccessSubtleNotification( {
	id,
	Notification,
} ) {
	const isAnalyticsConnected = useSelect( ( select ) =>
		select( CORE_MODULES ).isModuleConnected( 'analytics-4' )
	);

	const isAdsConnected = useSelect( ( select ) =>
		select( CORE_MODULES ).isModuleConnected( 'ads' )
	);

	function getDescription() {
		if ( isAnalyticsConnected && isAdsConnected ) {
			return __(
				'You can always disable it in Analytics or Ads settings',
				'google-site-kit'
			);
		}

		if ( isAnalyticsConnected ) {
			return __(
				'You can always disable it in Analytics settings',
				'google-site-kit'
			);
		}

		// If Analytics is not connected, Ads will be.
		return __(
			'You can always disable it in Ads settings',
			'google-site-kit'
		);
	}

	return (
		<Notification>
			<SubtleNotification
				title={ __(
					'You successfully enabled First-party mode!',
					'google-site-kit'
				) }
				description={ getDescription() }
				dismissCTA={
					<Dismiss
						id={ id }
						primary={ false }
						dismissLabel={ __( 'Got it', 'google-site-kit' ) }
					/>
				}
			/>
		</Notification>
	);
}

FirstPartyModeSetupSuccessSubtleNotification.propTypes = {
	id: PropTypes.string.isRequired,
	Notification: PropTypes.elementType.isRequired,
};
