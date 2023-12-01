/**
 * AdSense SetupSelectAccount component.
 *
 * Site Kit by Google, Copyright 2022 Google LLC
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
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { AccountSelect, ErrorNotices } from '../common';

export default function SetupSelectAccount() {
	return (
		<Fragment>
			<h3 className="googlesitekit-heading-4 googlesitekit-setup-module__title">
				{ __( 'Select your AdSense account', 'google-site-kit' ) }
			</h3>

			<ErrorNotices />

			<p>
				{ __(
					'Looks like you have multiple AdSense accounts associated with your Google account. Select the account to use with Site Kit below.',
					'google-site-kit'
				) }
			</p>

			<div className="googlesitekit-setup-module__inputs">
				<AccountSelect />
			</div>
		</Fragment>
	);
}
