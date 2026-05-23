/**
 * EmailReportingDisabledViewOnlyNotice component.
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

/**
 * Internal dependencies
 */
import { useSelect } from 'googlesitekit-data';
import { EMAIL_REPORTS_DISABLED_NOTICE } from '@/js/components/email-reporting/notices/EmailReportingDisabledNotice';
import Notice from '@/js/components/Notice';
import { NOTICE_TYPES } from '@/js/components/Notice/constants';
import { CORE_SITE } from '@/js/googlesitekit/datastore/site/constants';
import useNotificationEvents from '@/js/googlesitekit/notifications/hooks/useNotificationEvents';
import useViewOnly from '@/js/hooks/useViewOnly';
import withIntersectionObserver from '@/js/util/withIntersectionObserver';

const NoticeWithIntersectionObserver = withIntersectionObserver( Notice );

export default function EmailReportingDisabledViewOnlyNotice() {
	const isEmailReportingEnabled = useSelect( ( select ) =>
		select( CORE_SITE ).isEmailReportingEnabled()
	);

	const isViewOnly = useViewOnly();

	// We use the same notice slug as the admin notice because the viewContext
	// prefixed to the event category will differencentiate the two.
	const trackEvents = useNotificationEvents( EMAIL_REPORTS_DISABLED_NOTICE );

	if ( isEmailReportingEnabled || ! isViewOnly ) {
		return null;
	}

	return (
		<NoticeWithIntersectionObserver
			type={ NOTICE_TYPES.WARNING }
			title={ __( 'Email reports are unavailable', 'google-site-kit' ) }
			description={ __(
				'To enable email reports, contact your administrator',
				'google-site-kit'
			) }
			onInView={ trackEvents.view }
		/>
	);
}
