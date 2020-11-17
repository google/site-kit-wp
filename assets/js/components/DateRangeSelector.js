/**
 * Date range selector component.
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
import { useCallback } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import DateRangeIcon from '../../svg/date-range.svg';
import { Option, Select } from '../material-components';
import { getAvailableDateRanges } from '../util/date-range';
import { STORE_NAME as CORE_USER } from '../googlesitekit/datastore/user/constants';
const { useSelect, useDispatch } = Data;

function DateRangeSelector() {
	const ranges = Object.values( getAvailableDateRanges() );
	const dateRange = useSelect( ( select ) => select( CORE_USER ).getDateRange() );
	const { setDateRange } = useDispatch( CORE_USER );
	const onChange = useCallback( ( index, item ) => {
		setDateRange( item.dataset.value );
	}, [ ranges ] );

	return (
		<div className="googlesitekit-date-range-selector">
			<div className="googlesitekit-date-range-selector__icon">
				<DateRangeIcon width="18" height="20" />
			</div>
			<Select
				id="date-selector-menu"
				enhanced
				className="googlesitekit-date-range-selector__select mdc-select--minimal"
				name="time_period"
				label=""
				onEnhancedChange={ onChange }
				value={ dateRange }
			>
				{ ranges.map( ( { slug, label } ) => (
					<Option key={ slug } value={ slug }>
						{ label }
					</Option>
				) ) }
			</Select>
		</div>
	);
}

export default DateRangeSelector;
