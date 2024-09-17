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
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { useDispatch, useSelect } from 'googlesitekit-data';
import { CORE_USER } from '../../../../../googlesitekit/datastore/user/constants';
import { Button } from 'googlesitekit-components';
import SubtleNotification from '../../SubtleNotification';
import { getContextScrollTop } from '../../../../../util/scroll';
import { useBreakpoint } from '../../../../../hooks/useBreakpoint';
import useDashboardType, {
	DASHBOARD_TYPE_MAIN,
} from '../../../../../hooks/useDashboardType';
import useViewOnly from '../../../../../hooks/useViewOnly';

export const AUDIENCE_SEGMENTATION_SETUP_SUCCESS_NOTIFICATION =
	'audience_segmentation_setup_success_notification';

export default function AudienceSegmentationSetupSuccessSubtleNotification() {
	const breakpoint = useBreakpoint();
	const dashboardType = useDashboardType();
	const viewOnly = useViewOnly();

	const configuredAudiences = useSelect( ( select ) =>
		select( CORE_USER ).getConfiguredAudiences()
	);

	const isDismissed = useSelect( ( select ) => {
		if ( ! dashboardType || viewOnly ) {
			return null;
		}

		return select( CORE_USER ).isItemDismissed(
			AUDIENCE_SEGMENTATION_SETUP_SUCCESS_NOTIFICATION
		);
	} );

	const { dismissItem } = useDispatch( CORE_USER );

	function dismissNotificationForUser() {
		dismissItem( AUDIENCE_SEGMENTATION_SETUP_SUCCESS_NOTIFICATION );
	}

	const scrollToWidgetArea = ( event ) => {
		event.preventDefault();

		dismissNotificationForUser();

		setTimeout( () => {
			const widgetClass =
				'.googlesitekit-widget-area--mainDashboardTrafficAudienceSegmentation';

			global.scrollTo( {
				top: getContextScrollTop( widgetClass, breakpoint ),
				behavior: 'smooth',
			} );
		}, 50 );
	};

	const shouldShowNotification =
		// Only show this notification on the main dashboard, where the Setup CTA Banner is shown.
		dashboardType === DASHBOARD_TYPE_MAIN &&
		// Don't show this notification on the view-only dashboard.
		! viewOnly &&
		// Don't show this notification if `isDismissed` call is still loading
		// or the user has dismissed it.
		! isDismissed &&
		// Only show this notification if the user has a set of configured audiences.
		Array.isArray( configuredAudiences );

	if ( ! shouldShowNotification ) {
		return null;
	}

	return (
		<SubtleNotification
			title={ __(
				'Success! Visitor groups added to your dashboard',
				'google-site-kit'
			) }
			description={ __(
				'Get to know how different types of visitors interact with your site, e.g. which pages they visit and for how long.',
				'google-site-kit'
			) }
			onDismiss={ dismissNotificationForUser }
			additionalCTA={
				<Button onClick={ scrollToWidgetArea }>
					{ __( 'Show me', 'google-site-kit' ) }
				</Button>
			}
		/>
	);
}
