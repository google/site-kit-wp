/**
 * TimezoneSelect component.
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
import {
	Select,
	Option,
} from '../../../material-components';
import { timeZonesByCountryCode } from '../util/countries-timezones';
import classnames from 'classnames';

export default function TimezoneSelect( { countryCode, hasError, ...props } ) {
	return (
		<Select
			className={ classnames(
				'googlesitekit-analytics__select-timezone',
				{ 'mdc-text-field--error': hasError }
			) }
			label={ __( 'Timezone', 'google-site-kit' ) }
			disabled={ ! countryCode }
			enhanced
			outlined
			{ ...props }
		>
			{
				( timeZonesByCountryCode[ countryCode ] || [] ).map(
					( { timeZoneId, displayName }, i ) => (
						<Option
							key={ i }
							value={ timeZoneId }
						>
							{ displayName }
						</Option>
					)
				)
			}
		</Select>
	);
}
