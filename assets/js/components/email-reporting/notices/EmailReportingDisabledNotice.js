/**
 * EmailReportingDisabledNotice component.
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
import { useDispatch } from '@wordpress/data';
import { useCallback } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { useSelect } from 'googlesitekit-data';
import useViewOnly from '@/js/hooks/useViewOnly';
import Notice from '@/js/components/Notice';
import { TYPES } from '@/js/components/Notice/constants';
import { CORE_SITE } from '@/js/googlesitekit/datastore/site/constants';
import { CORE_UI } from '@/js/googlesitekit/datastore/ui/constants';
import { USER_SETTINGS_SELECTION_PANEL_OPENED_KEY } from '@/js/components/email-reporting/constants';
import withIntersectionObserver from '@/js/util/withIntersectionObserver';
import useNotificationEvents from '@/js/googlesitekit/notifications/hooks/useNotificationEvents';

const EMAIL_REPORTING_DISABLED_NOTICE =
	'email_reports_user_settings_reports_disabled_notice';

const NoticeWithIntersectionObserver = withIntersectionObserver( Notice );

export default function EmailReportingDisabledNotice() {
	const isEmailReportingEnabled = useSelect( ( select ) =>
		select( CORE_SITE ).isEmailReportingEnabled()
	);

	const isViewOnly = useViewOnly();

	const adminSettingsURL = useSelect( ( select ) =>
		select( CORE_SITE ).getSiteKitAdminSettingsURL()
	);

	const trackEvents = useNotificationEvents(
		EMAIL_REPORTING_DISABLED_NOTICE
	);

	// If the user is on the Admin Settings page already, then there
	// will be no navigation when the "Edit settings" CTA is clicked,
	// keeping the Settings Panel open. So we should close it.
	const { setValue } = useDispatch( CORE_UI );
	const onCTAClick = useCallback( () => {
		trackEvents.confirm();
		setValue( USER_SETTINGS_SELECTION_PANEL_OPENED_KEY, false );
	}, [ setValue, trackEvents ] );

	if ( isEmailReportingEnabled || isViewOnly ) {
		return null;
	}

	return (
		<NoticeWithIntersectionObserver
			type={ TYPES.WARNING }
			title={ __( 'Email reports are disabled', 'google-site-kit' ) }
			description={ __(
				'This feature was disabled for all users. You can enable email reports subscriptions in settings',
				'google-site-kit'
			) }
			ctaButton={ {
				label: __( 'Edit settings', 'google-site-kit' ),
				href: adminSettingsURL,
				onClick: onCTAClick,
			} }
			onInView={ trackEvents.view }
		/>
	);
}
