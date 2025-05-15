/**
 * AudienceSegmentationSetupSuccessSubtleNotification component.
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
import { useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import SubtleNotification from '../../../../../googlesitekit/notifications/components/layout/SubtleNotification';
import { getNavigationalScrollTop } from '../../../../../util/scroll';
import { useBreakpoint } from '../../../../../hooks/useBreakpoint';
import Dismiss from '../../../../../googlesitekit/notifications/components/common/Dismiss';
import CTALinkSubtle from '../../../../../googlesitekit/notifications/components/common/CTALinkSubtle';
import { useDispatch, useSelect } from 'googlesitekit-data';
import {
	CORE_NOTIFICATIONS,
	NOTIFICATION_AREAS,
} from '../../../../../googlesitekit/notifications/datastore/constants';
import { CORE_USER } from '../../../../../googlesitekit/datastore/user/constants';
import { VIEW_CONTEXT_MAIN_DASHBOARD } from '../../../../../googlesitekit/constants';

export const AUDIENCE_SEGMENTATION_SETUP_SUCCESS_NOTIFICATION =
	'setup-success-notification-audiences';

export const notification = {
	Component: AudienceSegmentationSetupSuccessSubtleNotification,
	areaSlug: NOTIFICATION_AREAS.BANNERS_BELOW_NAV,
	viewContexts: [ VIEW_CONTEXT_MAIN_DASHBOARD ],
	// checkRequirements: async ( { select, resolveSelect } ) => {
	// 	const analyticsConnected = await resolveSelect(
	// 		CORE_MODULES
	// 	).isModuleConnected( 'analytics-4' );

	// 	if ( ! analyticsConnected ) {
	// 		return false;
	// 	}

	// 	await resolveSelect( MODULES_ANALYTICS_4 ).getAudienceSettings();
	// 	await resolveSelect( CORE_USER ).getUserAudienceSettings();

	// 	const currentUserID = select( CORE_USER ).getID();

	// 	const audienceSegmentationSetupCompletedByUserID =
	// 		select(
	// 			MODULES_ANALYTICS_4
	// 		).getAudienceSegmentationSetupCompletedBy();

	// 	if (
	// 		currentUserID !== audienceSegmentationSetupCompletedByUserID
	// 	) {
	// 		return false;
	// 	}

	// 	const configuredAudiences =
	// 		select( CORE_USER ).getConfiguredAudiences();

	// 	// Only show this notification if the user has a set of configured audiences.
	// 	return Array.isArray( configuredAudiences );
	// },
	checkRequirements: () => {
		return true;
	},
	isDismissible: true,
	id: AUDIENCE_SEGMENTATION_SETUP_SUCCESS_NOTIFICATION,
};

export default function AudienceSegmentationSetupSuccessSubtleNotification( {
	id,
	Notification,
} ) {
	const breakpoint = useBreakpoint();
	const { dismissNotification } = useDispatch( CORE_NOTIFICATIONS );
	const isAudienceSegmentationWidgetHidden = useSelect( ( select ) =>
		select( CORE_USER ).isAudienceSegmentationWidgetHidden()
	);

	useEffect( () => {
		if ( isAudienceSegmentationWidgetHidden ) {
			dismissNotification(
				AUDIENCE_SEGMENTATION_SETUP_SUCCESS_NOTIFICATION
			);
		}
	}, [ dismissNotification, isAudienceSegmentationWidgetHidden ] );

	const scrollToWidgetArea = ( event ) => {
		event.preventDefault();

		dismissNotification( AUDIENCE_SEGMENTATION_SETUP_SUCCESS_NOTIFICATION );

		setTimeout( () => {
			const widgetClass =
				'.googlesitekit-widget-area--mainDashboardTrafficAudienceSegmentation';

			global.scrollTo( {
				top: getNavigationalScrollTop( widgetClass, breakpoint ),
				behavior: 'smooth',
			} );
		}, 50 );
	};

	if ( isAudienceSegmentationWidgetHidden === undefined ) {
		return null;
	}

	return (
		<Notification>
			<SubtleNotification
				title={ __(
					'Success! Visitor groups added to your dashboard',
					'google-site-kit'
				) }
				description={ __(
					'Get to know how different types of visitors interact with your site, e.g. which pages they visit and for how long',
					'google-site-kit'
				) }
				dismissCTA={
					<Dismiss
						id={ id }
						primary={ false }
						dismissLabel={ __( 'Got it', 'google-site-kit' ) }
					/>
				}
				additionalCTA={
					<CTALinkSubtle
						id={ id }
						ctaLabel={ __( 'Show me', 'google-site-kit' ) }
						onCTAClick={ scrollToWidgetArea }
					/>
				}
			/>
		</Notification>
	);
}

AudienceSegmentationSetupSuccessSubtleNotification.propTypes = {
	id: PropTypes.string.isRequired,
	Notification: PropTypes.elementType.isRequired,
};
