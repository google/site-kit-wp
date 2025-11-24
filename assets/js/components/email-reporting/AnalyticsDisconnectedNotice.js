/**
 * AnalyticsDisconnectedNotice component.
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
import { useCallback } from '@wordpress/element';

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

export const EMAIL_REPORTING_ANALYTICS_DISCONNECTED_NOTICE_DISMISSED_ITEM =
	'email-reporting-analytics-disconnected-notice';

export default function AnalyticsDisconnectedNotice() {
	const isEmailReportingEnabled = useSelect( ( select ) =>
		select( CORE_USER ).isEmailReportingEnabled()
	);

	const isAnalyticsConnected = useSelect( ( select ) =>
		select( CORE_MODULES ).isModuleConnected( MODULE_SLUG_ANALYTICS_4 )
	);

	const wasAnalyticsConnected = useSelect( ( select ) =>
		select( CORE_SITE ).getWasAnalytics4Connected()
	);

	const isDismissed = useSelect( ( select ) =>
		select( CORE_USER ).isItemDismissed(
			EMAIL_REPORTING_ANALYTICS_DISCONNECTED_NOTICE_DISMISSED_ITEM
		)
	);

	const { dismissItem } = useDispatch( CORE_USER );

	const activateAnalytics = useActivateModuleCallback(
		MODULE_SLUG_ANALYTICS_4
	);

	const handleDismiss = useCallback( async () => {
		await dismissItem(
			EMAIL_REPORTING_ANALYTICS_DISCONNECTED_NOTICE_DISMISSED_ITEM
		);
	}, [ dismissItem ] );

	if (
		! isEmailReportingEnabled ||
		isDismissed !== false ||
		isAnalyticsConnected ||
		! wasAnalyticsConnected
	) {
		return null;
	}

	return (
		<Notice
			className="googlesitekit-email-reporting__analytics-disconnected-notice"
			type={ TYPES.WARNING }
			title={ __( 'Analytics is disconnected', 'google-site-kit' ) }
			description={ __(
				'Email reports won’t include Analytics data and metrics',
				'google-site-kit'
			) }
			ctaButton={ {
				label: __( 'Connect Analytics', 'google-site-kit' ),
				onClick: activateAnalytics,
			} }
			dismissButton={ {
				label: __( 'Got it', 'google-site-kit' ),
				onClick: handleDismiss,
			} }
		/>
	);
}
