/**
 * SetupAnalyticsNotice component.
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
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	createInterpolateElement,
	useCallback,
	useState,
} from '@wordpress/element';

/**
 * Internal dependencies
 */
import { useDispatch, useSelect } from 'googlesitekit-data';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import Notice from '@/js/components/Notice';
import { TYPES } from '@/js/components/Notice/constants';
import { CORE_SITE } from '@/js/googlesitekit/datastore/site/constants';
import { CORE_MODULES } from '@/js/googlesitekit/modules/datastore/constants';
import { MODULE_SLUG_ANALYTICS_4 } from '@/js/modules/analytics-4/constants';
import useActivateModuleCallback from '@/js/hooks/useActivateModuleCallback';
import useCompleteModuleActivationCallback from '@/js/hooks/useCompleteModuleActivationCallback';
import useViewOnly from '@/js/hooks/useViewOnly';
import useNotificationEvents from '@/js/googlesitekit/notifications/hooks/useNotificationEvents';
import LearnMoreLink from '@/js/googlesitekit/notifications/components/common/LearnMoreLink';
import withIntersectionObserver from '@/js/util/withIntersectionObserver';

export const EMAIL_REPORTING_SETUP_ANALYTICS_NOTICE_DISMISSED_ITEM =
	'email-reporting-setup-analytics-notice';

export const EMAIL_REPORTS_SETUP_ANALYTICS_NOTICE_SLUG =
	'email_reports_setup_analytics_notice';

const NoticeWithIntersectionObserver = withIntersectionObserver( Notice );

export default function SetupAnalyticsNotice() {
	const [ inProgress, setInProgress ] = useState( false );

	const trackEvents = useNotificationEvents(
		EMAIL_REPORTS_SETUP_ANALYTICS_NOTICE_SLUG
	);

	const isEmailReportingEnabled = useSelect( ( select ) =>
		select( CORE_SITE ).isEmailReportingEnabled()
	);

	const isViewOnly = useViewOnly();

	const isAnalyticsActive = useSelect( ( select ) =>
		select( CORE_MODULES ).isModuleActive( MODULE_SLUG_ANALYTICS_4 )
	);

	const isAnalyticsConnected = useSelect( ( select ) =>
		select( CORE_MODULES ).isModuleConnected( MODULE_SLUG_ANALYTICS_4 )
	);

	const isAnalyticsDisconnected = useSelect( ( select ) =>
		select( CORE_MODULES ).isModuleDisconnected( MODULE_SLUG_ANALYTICS_4 )
	);

	const isDismissed = useSelect( ( select ) =>
		select( CORE_USER ).isItemDismissed(
			EMAIL_REPORTING_SETUP_ANALYTICS_NOTICE_DISMISSED_ITEM
		)
	);

	const { dismissItem } = useDispatch( CORE_USER );

	const activateAnalytics = useActivateModuleCallback(
		MODULE_SLUG_ANALYTICS_4
	);

	const completeModuleActivation = useCompleteModuleActivationCallback(
		MODULE_SLUG_ANALYTICS_4
	);

	// If Analytics is already active but not connected, skip activation
	// and go directly to the setup flow.
	const onClickCallback = isAnalyticsActive
		? completeModuleActivation
		: activateAnalytics;

	const handleCTAClick = useCallback( () => {
		if ( ! onClickCallback ) {
			return;
		}
		trackEvents.confirm();
		setInProgress( true );
		onClickCallback();
	}, [ onClickCallback, trackEvents ] );

	const handleDismiss = useCallback( async () => {
		trackEvents.dismiss();
		await dismissItem(
			EMAIL_REPORTING_SETUP_ANALYTICS_NOTICE_DISMISSED_ITEM
		);
	}, [ dismissItem, trackEvents ] );

	const learnMoreLink = useSelect( ( select ) =>
		select( CORE_SITE ).getDocumentationLinkURL( 'ga4' )
	);

	if (
		! isEmailReportingEnabled ||
		isViewOnly ||
		isDismissed !== false ||
		isAnalyticsConnected ||
		isAnalyticsDisconnected
	) {
		return null;
	}

	const ctaLabel = isAnalyticsActive
		? __( 'Complete setup', 'google-site-kit' )
		: __( 'Connect Analytics', 'google-site-kit' );

	return (
		<NoticeWithIntersectionObserver
			type={ TYPES.NEW }
			title={ __(
				'HERE Understand how visitors interact with your content',
				'google-site-kit'
			) }
			description={ createInterpolateElement(
				__(
					'Get visitor insights in your email report by connecting Analytics. <a>Learn more</a>',
					'google-site-kit'
				),
				{
					a: (
						<LearnMoreLink
							id={ EMAIL_REPORTS_SETUP_ANALYTICS_NOTICE_SLUG }
							label={ __( 'Learn more', 'google-site-kit' ) }
							url={ learnMoreLink }
						/>
					),
				}
			) }
			ctaButton={ {
				label: ctaLabel,
				inProgress,
				disabled: inProgress,
				onClick: handleCTAClick,
			} }
			dismissButton={ {
				label: __( 'Maybe later', 'google-site-kit' ),
				onClick: handleDismiss,
			} }
			onInView={ trackEvents.view }
		/>
	);
}
