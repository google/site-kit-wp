/**
 * Reader Revenue Manager SettingsView component.
 *
 * Site Kit by Google, Copyright 2024 Google LLC
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

export default function SettingsView() {
	return (
		<div className="googlesitekit-setup-module googlesitekit-setup-module--thank-with-google">
			<h2 className="googlesitekit-heading-3 googlesitekit-setup-module__title">
				{ __(
					'Reader Revenue Manager Settings View',
					'google-site-kit'
				) }
			</h2>

			{ /* TODO: Add the rest of the settings steps */ }
		</div>
	);
}
