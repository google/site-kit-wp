/**
 * SetupUsingProxyWithSignIn ResetNotice component.
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
import { getQueryArg } from '@wordpress/url';

/**
 * Internal dependencies
 */
import Notice from '@/js/components/Notice';
import { NOTICE_TYPES } from '@/js/components/Notice/constants';

export default function ResetNotice() {
	if ( getQueryArg( location.href, 'notification' ) !== 'reset_success' ) {
		return null;
	}

	return (
		<div className="googlesitekit-setup__reset-notice">
			<Notice
				// @ts-expect-error - The `Notice` component is not currently typed.
				id="reset_success"
				title={ __(
					'Site Kit by Google was successfully reset.',
					'google-site-kit'
				) }
				type={ NOTICE_TYPES.SUCCESS }
			/>
			<br />
		</div>
	);
}
