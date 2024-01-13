/**
 * TimezoneSelect component.
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
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { Option, Select } from 'googlesitekit-components';
import Data from 'googlesitekit-data';
import { timeZonesByCountryCode } from '../../../utils/countries-timezones';
import { FORM_ACCOUNT_CREATE } from '../../../datastore/constants';
import { CORE_FORMS } from '../../../../../googlesitekit/datastore/forms/constants';

const { useSelect, useDispatch } = Data;

export default function TimezoneSelect() {
	const countryCode = useSelect( ( select ) =>
		select( CORE_FORMS ).getValue( FORM_ACCOUNT_CREATE, 'countryCode' )
	);
	const value = useSelect( ( select ) =>
		select( CORE_FORMS ).getValue( FORM_ACCOUNT_CREATE, 'timezone' )
	);

	const { setValues } = useDispatch( CORE_FORMS );
	const onEnhancedChange = useCallback(
		( i, item ) => {
			setValues( FORM_ACCOUNT_CREATE, { timezone: item.dataset.value } );
		},
		[ setValues ]
	);

	return (
		<Select
			className="googlesitekit-analytics__select-timezone"
			label={ __( 'Timezone', 'google-site-kit' ) }
			value={ value }
			onEnhancedChange={ onEnhancedChange }
			disabled={ ! countryCode }
			enhanced
			outlined
		>
			{ ( timeZonesByCountryCode[ countryCode ] || [] ).map(
				// eslint-disable-next-line sitekit/acronym-case
				( { timeZoneId, displayName }, i ) => (
					<Option
						key={ i }
						// eslint-disable-next-line sitekit/acronym-case
						value={ timeZoneId }
					>
						{ displayName }
					</Option>
				)
			) }
		</Select>
	);
}
