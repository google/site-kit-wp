/**
 * SendingErrorNotice component.
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
import Notice from '@/js/components/Notice';
import { TYPES } from '@/js/components/Notice/constants';
import useNotificationEvents from '@/js/googlesitekit/notifications/hooks/useNotificationEvents';
import withIntersectionObserver from '@/js/util/withIntersectionObserver';

export const EMAIL_REPORTING_SENDING_ERROR_NOTICE =
	'email_reporting_sending_error_notice';

const NoticeWithIntersectionObserver = withIntersectionObserver( Notice );

export default function SendingErrorNotice() {
	const trackEvents = useNotificationEvents(
		EMAIL_REPORTING_SENDING_ERROR_NOTICE
	);

	return (
		<NoticeWithIntersectionObserver
			className="googlesitekit-email-reporting__admin-settings-notice"
			type={ TYPES.ERROR }
			title={ __(
				'Email reports are failing to send',
				'google-site-kit'
			) }
			description={ __(
				'We were unable to deliver your report, likely due to your WordPress email configuration. To fix this, go to your WordPress site’s system settings or contact your host. Report delivery will automatically resume once the issue is resolved. ',
				'google-site-kit'
			) }
			onInView={ trackEvents.view }
		/>
	);
}
