/**
 * EmailReportingErrorNotice component.
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
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { useSelect } from 'googlesitekit-data';
import Notice from '@/js/components/Notice';
import { TYPES } from '@/js/components/Notice/constants';
import { CORE_SITE } from '@/js/googlesitekit/datastore/site/constants';
import useViewOnly from '@/js/hooks/useViewOnly';
import useNotificationEvents from '@/js/googlesitekit/notifications/hooks/useNotificationEvents';
import withIntersectionObserver from '@/js/util/withIntersectionObserver';

export const EMAIL_REPORTING_ERROR_NOTICE = 'email_reporting_error_notice';

const NoticeWithIntersectionObserver = withIntersectionObserver( Notice );

export default function EmailReportingErrorNotice() {
	const isViewOnly = useViewOnly();

	const trackEvents = useNotificationEvents( EMAIL_REPORTING_ERROR_NOTICE );

	const isEmailReportingEnabled = useSelect( ( select ) =>
		select( CORE_SITE ).isEmailReportingEnabled()
	);

	const emailReportingErrors = useSelect( ( select ) =>
		select( CORE_SITE ).getEmailReportingErrors()
	);

	if (
		! isEmailReportingEnabled ||
		isViewOnly ||
		emailReportingErrors?.length === 0
	) {
		return null;
	}

	return (
		<NoticeWithIntersectionObserver
			className="googlesitekit-email-reporting__admin_settings_notice"
			type={ TYPES.ERROR }
			title={ __( 'Email reports are paused', 'google-site-kit' ) }
			description={ __(
				'We were unable to deliver your report. Report delivery will automatically resume once the issue is resolved.',
				'google-site-kit'
			) }
			onInView={ trackEvents.view }
		/>
	);
}
