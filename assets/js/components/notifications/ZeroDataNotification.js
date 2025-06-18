/**
 * ZeroDataNotification component.
 *
 * Site Kit by Google, Copyright 2022 Google LLC
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
import { useDispatch, useSelect } from 'googlesitekit-data';
import { CORE_SITE } from '../../googlesitekit/datastore/site/constants';
import { DAY_IN_SECONDS } from '../../util';
import BannerNotification from '@/js/googlesitekit/notifications/components/layout/BannerNotification';
import { TYPES } from '@/js/googlesitekit/notifications/constants';
import notEnoughTrafficDesktopSVG from '@/svg/graphics/banner-not-enough-traffic.svg?url';
import { CORE_NOTIFICATIONS } from '@/js/googlesitekit/notifications/datastore/constants';

export default function ZeroDataNotification( { id, Notification } ) {
	const notEnoughTrafficURL = useSelect( ( select ) => {
		return select( CORE_SITE ).getDocumentationLinkURL(
			'not-enough-traffic'
		);
	} );

	const { dismissNotification } = useDispatch( CORE_NOTIFICATIONS );

	const ctaClick = () => {
		dismissNotification( id, {
			expiresInSeconds: DAY_IN_SECONDS,
		} );
	};

	return (
		<Notification>
			<BannerNotification
				notificationID={ id }
				type={ TYPES.WARNING }
				title={ __(
					'Not enough traffic yet to display stats',
					'google-site-kit'
				) }
				description={ __(
					'Site Kit will start showing stats on the dashboard as soon as enough people have visited your site. Keep working on your site to attract more visitors.',
					'google-site-kit'
				) }
				learnMoreLink={ {
					href: notEnoughTrafficURL,
				} }
				ctaButton={ {
					label: __( 'OK, got it', 'google-site-kit' ),
					onClick: ctaClick,
				} }
				svg={ {
					desktop: notEnoughTrafficDesktopSVG,
					hideOnMobile: true,
					hideOnTablet: true,
					verticalPosition: 'center',
				} }
			/>
		</Notification>
	);
}
