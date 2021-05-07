/**
 * Date range selector component.
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
 * External dependencies
 */
import { useClickAway } from 'react-use';

/**
 * WordPress dependencies
 */
import { useCallback, useRef, useState } from '@wordpress/element';
import { ESCAPE, TAB } from '@wordpress/keycodes';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import DateRangeIcon from '../../svg/date-range.svg';
import Menu from './Menu';
import { getAvailableDateRanges } from '../util/date-range';
import { CORE_USER } from '../googlesitekit/datastore/user/constants';
import { useKeyCodesInside } from '../hooks/useKeyCodesInside';
import Button from './Button';

const { useSelect, useDispatch } = Data;

function DateRangeSelector() {
	const ranges = getAvailableDateRanges();
	const dateRange = useSelect( ( select ) => select( CORE_USER ).getDateRange() );
	const { setDateRange } = useDispatch( CORE_USER );

	const [ menuOpen, setMenuOpen ] = useState( false );
	const menuWrapperRef = useRef();

	useClickAway( menuWrapperRef, () => setMenuOpen( false ) );

	useKeyCodesInside( [ ESCAPE, TAB ], menuWrapperRef, () => setMenuOpen( false ) );

	const handleMenu = useCallback( () => {
		setMenuOpen( ! menuOpen );
	}, [ menuOpen ] );

	const handleMenuItemSelect = useCallback( ( index ) => {
		setDateRange( Object.values( ranges )[ index ].slug );
		setMenuOpen( false );
	}, [ ranges, setDateRange ] );

	const currentDateRangeLabel = ranges[ dateRange ]?.label;
	const menuItems = Object.values( ranges ).map( ( range ) => range.label );

	return (
		<div ref={ menuWrapperRef } className="googlesitekit-date-range-selector googlesitekit-dropdown-menu mdc-menu-surface--anchor">
			<Button
				className="googlesitekit-header__date-range-selector-menu mdc-button--dropdown googlesitekit-header__dropdown"
				text
				onClick={ handleMenu }
				icon={ <DateRangeIcon width="18" height="20" /> }
				aria-haspopup="menu"
				aria-expanded={ menuOpen }
				aria-controls="date-range-selector-menu"
			>
				{ currentDateRangeLabel }
			</Button>
			<Menu
				menuOpen={ menuOpen }
				menuItems={ menuItems }
				onSelected={ handleMenuItemSelect }
				id="date-range-selector-menu"
				className="googlesitekit-width-auto"
			/>
		</div>
	);
}

export default DateRangeSelector;
