/**
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
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import SupportLink from '../../../../components/SupportLink';
import SettingsNotice from '../../../../components/SettingsNotice';
import { TYPE_WARNING } from '../../../../components/SettingsNotice/utils';

export default function OptimizeSunsetNotice() {
	return (
		<SettingsNotice
			type={ TYPE_WARNING }
			notice={ __(
				'Optimize will no longer work after September 30, 2023 and will be removed from subsequent versions of Site Kit after that date.',
				'google-site-kit'
			) }
			LearnMore={ () => (
				<SupportLink path="/optimize/answer/12979939" external>
					{ __( 'Learn more', 'google-site-kit' ) }
				</SupportLink>
			) }
		/>
	);
}
