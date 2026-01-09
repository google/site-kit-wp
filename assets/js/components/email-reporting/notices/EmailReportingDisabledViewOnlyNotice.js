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
import Notice from '@/js/components/Notice';
import { TYPES } from '@/js/components/Notice/constants';
import { CORE_SITE } from '@/js/googlesitekit/datastore/site/constants';
import useViewOnly from '@/js/hooks/useViewOnly';

export default function EmailReportingDisabledViewOnlyNotice() {
	const isEmailReportingEnabled = useSelect( ( select ) =>
		select( CORE_SITE ).isEmailReportingEnabled()
	);

	const isViewOnly = useViewOnly();

	if ( isEmailReportingEnabled || ! isViewOnly ) {
		return null;
	}

	return (
		<Notice
			type={ TYPES.WARNING }
			title={ __( 'Email reports are unavailable', 'google-site-kit' ) }
			description={ __(
				'To enable email reports, contact your administrator',
				'google-site-kit'
			) }
		/>
	);
}
