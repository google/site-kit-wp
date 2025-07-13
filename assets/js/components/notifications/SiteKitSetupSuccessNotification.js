/**
 * SiteKitSetupSuccessNotification component.
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
import PropTypes from 'prop-types';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { createInterpolateElement, useCallback } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { useSelect } from 'googlesitekit-data';
import { CORE_SITE } from '../../googlesitekit/datastore/site/constants';
import useQueryArg from '../../hooks/useQueryArg';
import BannerNotification from '../../googlesitekit/notifications/components/layout/BannerNotification';
import Link from '../Link';
import SuccessSetupSVG from '@/svg/graphics/banner-site-kit-setup-success.svg?url';

export default function SiteKitSetupSuccessNotification( {
	id,
	Notification,
} ) {
	const connectMoreServicesURL = useSelect( ( select ) =>
		select( CORE_SITE ).getConnectMoreServicesURL()
	);

	const [ , setNotification ] = useQueryArg( 'notification' );

	const onDismiss = useCallback( () => {
		setNotification( undefined );
	}, [ setNotification ] );

	return (
		<Notification>
			<BannerNotification
				notificationID={ id }
				title={ __(
					'Congrats on completing the setup for Site Kit!',
					'google-site-kit'
				) }
				description={ createInterpolateElement(
					__(
						'Connect more services to see more stats. Go to <a>Settings</a>',
						'google-site-kit'
					),
					{
						a: <Link href={ connectMoreServicesURL } />,
					}
				) }
				dismissButton={ {
					label: __( 'Got it!', 'google-site-kit' ),
					onClick: onDismiss,
					tertiary: false,
				} }
				svg={ {
					desktop: SuccessSetupSVG,
					verticalPosition: 'center',
				} }
			/>
		</Notification>
	);
}

SiteKitSetupSuccessNotification.propTypes = {
	id: PropTypes.string.isRequired,
	Notification: PropTypes.elementType,
};
