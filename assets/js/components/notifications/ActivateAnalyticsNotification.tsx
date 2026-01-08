/**
 * ActivateAnalyticsNotification component.
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
import { FC } from 'react';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { useSelect } from 'googlesitekit-data';
import { useShowTooltip } from '@/js/components/AdminScreenTooltip';
import { CORE_LOCATION } from '@/js/googlesitekit/datastore/location/constants';
import { CORE_MODULES } from '@/js/googlesitekit/modules/datastore/constants';
import BannerNotification from '@/js/googlesitekit/notifications/components/layout/BannerNotification';
import { CORE_NOTIFICATIONS } from '@/js/googlesitekit/notifications/datastore/constants';
import useActivateModuleCallback from '@/js/hooks/useActivateModuleCallback';
import { MODULE_SLUG_ANALYTICS_4 } from '@/js/modules/analytics-4/constants';
import { MODULES_ANALYTICS_4 } from '@/js/modules/analytics-4/datastore/constants';
import { WEEK_IN_SECONDS } from '@/js/util';
// @ts-expect-error - We need to add types for imported SVGs.
import ActivateAnalyticsSVG from '@/svg/graphics/activate-analytics-graphic.svg?url';

interface ActivateAnalyticsNotificationProps {
	id: string;
	Notification: React.ElementType;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- `@wordpress/data` is not typed yet.
type SelectFunction = ( select: any ) => any;

const ActivateAnalyticsNotification: FC<
	ActivateAnalyticsNotificationProps
> = ( { id, Notification } ) => {
	const tooltipSettings = {
		tooltipSlug: id,
		title: __(
			'You can always set up Analytics from Settings later',
			'google-site-kit'
		),
		dismissLabel: __( 'Got it', 'google-site-kit' ),
	};

	const showTooltip = useShowTooltip( tooltipSettings );

	const isDismissalFinal = useSelect( ( select: SelectFunction ) =>
		select( CORE_NOTIFICATIONS ).isNotificationDismissalFinal( id )
	);

	const isNavigatingToReauthURL = useSelect( ( select: SelectFunction ) => {
		const adminReauthURL =
			select( MODULES_ANALYTICS_4 ).getAdminReauthURL();

		if ( ! adminReauthURL ) {
			return false;
		}

		return select( CORE_LOCATION ).isNavigatingTo( adminReauthURL );
	} );

	const isActivatingAnalytics = useSelect( ( select: SelectFunction ) =>
		select( CORE_MODULES ).isFetchingSetModuleActivation(
			MODULE_SLUG_ANALYTICS_4,
			true
		)
	);

	const activateAnalytics = useActivateModuleCallback(
		MODULE_SLUG_ANALYTICS_4
	);

	const isBusy = isActivatingAnalytics || isNavigatingToReauthURL;

	return (
		<Notification>
			{ /* @ts-expect-error - The `BannerNotification` component is not typed yet. */ }
			<BannerNotification
				notificationID={ id }
				title={ __(
					'Understand how visitors interact with your content',
					'google-site-kit'
				) }
				description={ __(
					'Get a deeper understanding of your customers. Google Analytics gives you the free tools you need to analyze data for your business in one place.',
					'google-site-kit'
				) }
				ctaButton={ {
					label: __( 'Set up Analytics', 'google-site-kit' ),
					onClick: activateAnalytics,
					disabled: isBusy,
					inProgress: isBusy,
					dismissOnClick: true,
					dismissOptions: {
						expiresInSeconds: 0,
						skipHidingFromQueue: true,
					},
				} }
				dismissButton={ {
					label: isDismissalFinal
						? __( 'Don’t show again', 'google-site-kit' )
						: __( 'Maybe later', 'google-site-kit' ),
					onClick: showTooltip,
					disabled: isBusy,
					dismissOptions: {
						expiresInSeconds: isDismissalFinal
							? 0
							: 2 * WEEK_IN_SECONDS,
					},
				} }
				svg={ {
					desktop: ActivateAnalyticsSVG,
					verticalPosition: 'center',
				} }
			/>
		</Notification>
	);
};

export default ActivateAnalyticsNotification;
