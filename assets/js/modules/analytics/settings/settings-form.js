/**
 * Analytics Settings form.
 *
 * Site Kit by Google, Copyright 2020 Google LLC
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
import AccountSelect from '../common/account-select';
import PropertySelect from '../common/property-select';
import ProfileSelect from '../common/profile-select';
import UseSnippetSwitch from '../common/use-snippet-switch';
import AnonymizeIPSwitch from '../common/anonymize-ip-switch';
import ExistingTagNotice from '../common/existing-tag-notice';
import TrackingExclusionSwitches from '../common/tracking-exclusion-switches';

export default function SettingsForm() {
	return (
		<div className="googlesitekit-analytics-settings-fields">
			<ExistingTagNotice />

			<div className="googlesitekit-setup-module__inputs">
				<AccountSelect />

				<PropertySelect />

				<ProfileSelect />
			</div>

			<div className="googlesitekit-setup-module__inputs googlesitekit-setup-module__inputs--multiline">
				<UseSnippetSwitch />

				<AnonymizeIPSwitch />

				<p className="googlesitekit-setup-module__text">
					{ __( 'Exclude from Analytics', 'google-site-kit' ) }
				</p>
				<TrackingExclusionSwitches />
			</div>
		</div>
	);
}
