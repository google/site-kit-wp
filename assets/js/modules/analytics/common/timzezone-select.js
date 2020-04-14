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

// Cache the complicated timezone dropdown.
let timezoneData = false;
let lastTimezone = false;

const TimezoneSelect = ( { timezone, setTimezone } ) => {
	if ( timezoneData && timezone === lastTimezone ) {
		return timezoneData;
	}
	const { timezones } = global.googlesitekit.admin;
	lastTimezone = timezone;

	timezoneData = (
		<Select
			className="googlesitekit-analytics__select-timezone"
			name="timezone"
			style={ { minWidth: '240px' } /*todo: move to css */ }
			enhanced
			value={ timezone }
			onEnhancedChange={ ( i, item ) => {
				setTimezone( item.dataset.value );
			} }
			label={ __( 'Timezone', 'google-site-kit' ) }
			outlined
		>
			{ timezones && timezones
				.map( ( aTimezone, index ) =>
					<Option
						key={ index }
						value={ aTimezone.value }
					>
						{ aTimezone.name }
					</Option>
				) }
		</Select>
	);
	return timezoneData;
};

export default TimezoneSelect;
