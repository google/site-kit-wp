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
 * Internal dependencies
 */
import { useSelect } from 'googlesitekit-data';
import { CORE_SITE } from '@/js/googlesitekit/datastore/site/constants';
import useViewOnly from '@/js/hooks/useViewOnly';
import SendingErrorNotice from '@/js/components/email-reporting/notices/errors/SendingErrorNotice';
import ServerErrorNotice from '@/js/components/email-reporting/notices/errors/ServerErrorNotice';

export const EMAIL_REPORTING_ERROR_NOTICE = 'email_reporting_error_notice';

export default function EmailReportingErrorNotices() {
	const isViewOnly = useViewOnly();

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

	switch ( emailReportingErrors?.errors[ 0 ]?.category_id ) {
		case 'sending_error':
			return <SendingErrorNotice />;
		default:
			return <ServerErrorNotice />;
	}
}
