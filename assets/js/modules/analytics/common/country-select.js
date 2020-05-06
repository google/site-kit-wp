/**
 * CountrySelect component.
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
 * External dependencies
 */
import PropTypes from 'prop-types';

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
import { allCountries } from '../util/countries-timezones';

export default function CountrySelect( props ) {
	return (
		<Select
			className="googlesitekit-analytics__select-country"
			label={ __( 'Country', 'google-site-kit' ) }
			enhanced
			outlined
			{ ...props }
		>
			{
				allCountries.map( ( { countryCode, displayName }, i ) => (
					<Option
						key={ i }
						value={ countryCode }
					>
						{ displayName }
					</Option>
				) )
			}
		</Select>
	);
}

CountrySelect.propTypes = {
	value: PropTypes.string.required,
	onEnhancedChange: PropTypes.func.required,
};
