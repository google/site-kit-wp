/**
 * User Settings Selection Notices
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
import { Fragment } from '@wordpress/element';

/**
 * Internal dependencies
 */
import AnalyticsDisconnectedNotice from '@/js/components/email-reporting/notices/AnalyticsDisconnectedNotice';
import EmailReportingDisabledNotice from '@/js/components/email-reporting/notices/EmailReportingDisabledNotice';
import EmailReportingDisabledViewOnlyNotice from '@/js/components/email-reporting/notices/EmailReportingDisabledViewOnlyNotice';
import SetupAnalyticsNotice from '@/js/components/email-reporting/notices/SetupAnalyticsNotice';

export default function Notices() {
	return (
		<Fragment>
			<AnalyticsDisconnectedNotice />
			<SetupAnalyticsNotice />
			<EmailReportingDisabledNotice />
			<EmailReportingDisabledViewOnlyNotice />
		</Fragment>
	);
}
