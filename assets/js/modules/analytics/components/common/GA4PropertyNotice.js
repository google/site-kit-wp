/**
 * Analytics GA4 Property Notice component.
 *
 * Site Kit by Google, Copyright 2021 Google LLC
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
import SettingsNotice, { TYPE_INFO } from '../../../../components/SettingsNotice';
import Link from '../../../../components/Link';

export default function GA4PropertyNotice() {
	return (
		<SettingsNotice type={ TYPE_INFO }>
			{ __( 'A Google Analytics 4 property will also be created.', 'google-site-kit' ) }
			{ ' ' }
			<Link
				href="https://sitekit.withgoogle.com/documentation/ga4-analytics-property/"
				external
				inherit
			>
				{ __( 'Learn more here.', 'google-site-kit' ) }
			</Link>
		</SettingsNotice>
	);
}
