/**
 * Reader Revenue Manager region select component.
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
 * External dependencies
 */
import { ComponentProps, FC } from 'react';

/**
 * WordPress dependencies
 */
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { Option, Select } from 'googlesitekit-components';
import { allCountries } from '@/js/modules/analytics-4/utils/countries-timezones';
import { regionCodeFormat } from '@/js/util';

type SelectProps = Omit< ComponentProps< typeof Select >, 'id' | 'onChange' >;

interface PublicationSetupRegionSelectProps extends SelectProps {
	id: string;
	onChange: ( value: string ) => void;
}

const PublicationSetupRegionSelect: FC<
	PublicationSetupRegionSelectProps
> = ( { id, onChange, ...props } ) => {
	const onEnhancedChange = useCallback(
		( _value, item ) => {
			onChange( item.dataset.value );
		},
		[ onChange ]
	);

	return (
		<Select
			helperText={ null }
			id={ id }
			label={ __( 'Home country', 'google-site-kit' ) }
			onEnhancedChange={ onEnhancedChange }
			enhanced
			outlined
			{ ...props }
		>
			{ allCountries.map( ( country ) => (
				<Option
					key={ country.countryCode }
					value={ country.countryCode }
				>
					{ regionCodeFormat( country.countryCode ) }
				</Option>
			) ) }
		</Select>
	);
};

export default PublicationSetupRegionSelect;
