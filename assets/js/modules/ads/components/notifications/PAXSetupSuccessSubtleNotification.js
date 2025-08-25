/**
 * PAXSetupSuccessSubtleNotification component.
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
import { useSelect } from '@wordpress/data';
import { useCallback } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { useDispatch } from 'googlesitekit-data';
import { CORE_NOTIFICATIONS } from '../../../../googlesitekit/notifications/datastore/constants';
import { MODULES_ADS } from '../../datastore/constants';
import { CORE_USER } from '../../../../googlesitekit/datastore/user/constants';
import NoticeNotification from '../../../../googlesitekit/notifications/components/layout/NoticeNotification';
import { TYPES } from '../../../../components/Notice/constants';
import useQueryArg from '../../../../hooks/useQueryArg';

export default function PAXSetupSuccessSubtleNotification( {
	id,
	Notification,
} ) {
	const { dismissNotification } = useDispatch( CORE_NOTIFICATIONS );

	const [ , setNotification ] = useQueryArg( 'notification' );

	const dismissNotice = useCallback( () => {
		setNotification( undefined );
	}, [ setNotification ] );

	const accountSelectorWrappedAccountOverviewURL = useSelect( ( select ) => {
		const accountOverviewURL =
			select( MODULES_ADS ).getAccountOverviewURL();

		if ( !! accountOverviewURL ) {
			return select( CORE_USER ).getAccountChooserURL(
				accountOverviewURL
			);
		}
		return null;
	} );

	const onPrimaryCTAClickCallback = useCallback( () => {
		dismissNotice();
		dismissNotification( id );
	}, [ dismissNotice, dismissNotification, id ] );

	return (
		<Notification>
			<NoticeNotification
				notificationID={ id }
				type={ TYPES.SUCCESS }
				title={ __(
					'Your Ads campaign was successfully set up!',
					'google-site-kit'
				) }
				description={ __(
					'Track your conversions, measure your campaign results and make the most of your ad spend',
					'google-site-kit'
				) }
				dismissButton={ {
					onClick: dismissNotice,
				} }
				ctaButton={ {
					onClick: onPrimaryCTAClickCallback,
					label: __( 'Show me', 'google-site-kit' ),
					href: accountSelectorWrappedAccountOverviewURL,
					external: true,
				} }
			/>
		</Notification>
	);
}

PAXSetupSuccessSubtleNotification.propTypes = {
	id: PropTypes.string.isRequired,
	Notification: PropTypes.elementType.isRequired,
};
