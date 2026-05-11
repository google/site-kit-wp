/**
 * ConnectMoreServicesNotification component.
 *
 * Site Kit by Google, Copyright 2026 Google LLC
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
import { FC, ElementType } from 'react';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { useDispatch, useSelect, type Select } from 'googlesitekit-data';
import BannerNotification from '@/js/googlesitekit/notifications/components/layout/BannerNotification';
import { useShowTooltip } from '@/js/components/AdminScreenTooltip';
import { CORE_LOCATION } from '@/js/googlesitekit/datastore/location/constants';
import { CORE_SITE } from '@/js/googlesitekit/datastore/site/constants';
import ConnectMoreServicesSVG from '@/svg/graphics/connect-more-services-graphic.svg?url';
import useViewContext from '@/js/hooks/useViewContext';

interface ConnectMoreServicesNotificationProps {
	id: string;
	Notification: ElementType;
}

const ConnectMoreServicesNotification: FC<
	ConnectMoreServicesNotificationProps
> = ( { id, Notification } ) => {
	const tooltipSettings = {
		tooltipSlug: id,
		title: __(
			'You can always set up additional services from Settings later',
			'google-site-kit'
		),
		dismissLabel: __( 'Got it', 'google-site-kit' ),
	};

	const showTooltip = useShowTooltip( tooltipSettings );
	const { navigateTo } = useDispatch( CORE_LOCATION );

	const connectMoreServicesURL = useSelect(
		( select: Select ) => select( CORE_SITE ).getConnectMoreServicesURL(),
		[]
	);

	const isNavigatingToConnectMoreServices = useSelect(
		( select: Select ) =>
			select( CORE_LOCATION ).isNavigatingTo( connectMoreServicesURL ),
		[ connectMoreServicesURL ]
	);

	const viewContext = useViewContext();

	return (
		<Notification>
			{ /* @ts-expect-error - The `BannerNotification` component is not typed yet. */ }
			<BannerNotification
				notificationID={ id }
				gaTrackingEventArgs={ {
					category: `${ viewContext }_connect-more-services-notification`,
				} }
				title={ __(
					'Boost your site’s performance by enhancing your dashboard',
					'google-site-kit'
				) }
				description={ __(
					'Connect more Google services to gain deeper insights and unlock useful functionality',
					'google-site-kit'
				) }
				ctaButton={ {
					label: __( 'Connect more services', 'google-site-kit' ),
					onClick: () => navigateTo( connectMoreServicesURL ),
					disabled: isNavigatingToConnectMoreServices,
					inProgress: isNavigatingToConnectMoreServices,
					dismissOnClick: true,
					dismissOptions: {
						expiresInSeconds: 0,
						skipHidingFromQueue: true,
					},
				} }
				dismissButton={ {
					label: __( 'Maybe later', 'google-site-kit' ),
					onClick: showTooltip,
					dismissOnClick: true,
					disabled: isNavigatingToConnectMoreServices,
					dismissOptions: {
						expiresInSeconds: 0,
					},
				} }
				svg={ {
					desktop: ConnectMoreServicesSVG,
					verticalPosition: 'center',
				} }
			/>
		</Notification>
	);
};

export default ConnectMoreServicesNotification;
