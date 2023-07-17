/**
 * Key Metrics Selection Panel Header
 *
 * Site Kit by Google, Copyright 2023 Google LLC
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
import { __, sprintf } from '@wordpress/i18n';

export default function Header() {
	return (
		<header className="googlesitekit-km-selection-panel-header">
			<h3>{ __( 'Select your metrics', 'google-site-kit' ) }</h3>
			<p>
				{ sprintf(
					/* translators: %d: Number of selected metrics. */
					__( '%d of 4 metrics selected', 'google-site-kit' ),
					0
				) }
			</p>
		</header>
	);
}
