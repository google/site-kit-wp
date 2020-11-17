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
import { useCallback, useEffect, useRef, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import DateRangeIcon from '../../svg/date-range.svg';
import Menu from './menu';
import { getAvailableDateRanges } from '../util/date-range';
import { STORE_NAME as CORE_USER } from '../googlesitekit/datastore/user/constants';
import Button from './button';
import { map } from 'lodash';
const { useSelect, useDispatch } = Data;

function DateRangeSelector() {
	const ranges = Object.values( getAvailableDateRanges() );
	const dateRange = useSelect( ( select ) => select( CORE_USER ).getDateRange() );
	const { setDateRange } = useDispatch( CORE_USER );

	const [ menuOpen, toggleMenu ] = useState( false );
	const menuButtonRef = useRef();
	const menuRef = useRef();

	useEffect( () => {
		const handleMenuClose = ( e ) => {
			// Close the menu if the user presses the Escape key
			// or if they click outside of the menu.
			if (
				( ( 'keyup' === e.type && 27 === e.keyCode ) || 'mouseup' === e.type ) &&
				! menuButtonRef.current.buttonRef.current.contains( e.target ) &&
				! menuRef.current.menuRef.current.contains( e.target )
			) {
				toggleMenu( false );
			}
		};

		global.addEventListener( 'mouseup', handleMenuClose );
		global.addEventListener( 'keyup', handleMenuClose );

		return () => {
			global.removeEventListener( 'mouseup', handleMenuClose );
			global.removeEventListener( 'keyup', handleMenuClose );
		};
	}, [] );

	const handleMenu = useCallback( () => {
		toggleMenu( ! menuOpen );
	}, [ menuOpen ] );

	const handleMenuItemSelect = useCallback( ( index, e ) => {
		if (
			( 'keydown' === e.type && ( 13 === e.keyCode || 32 === e.keyCode ) ) || // Enter or Space is pressed.
			'click' === e.type // Mouse is clicked
		) {
			setDateRange( ranges[ index ].slug );
			toggleMenu( false );
		}
	}, [ handleMenu ] );

	const currentDateRangeLabel = ranges.reduce( ( acc, range ) => {
		return range.slug === dateRange ? range : acc;
	}, {} ).label;

	const menuItems = map( ranges, 'label' );

	return (
		<div className="googlesitekit-date-range-selector">
			<Button
				ref={ menuButtonRef }
				className="googlesitekit-header__date-range-selector-menu mdc-button--dropdown"
				text
				onClick={ handleMenu }
				icon={ ( <DateRangeIcon width="18" height="20" /> ) }
				aria-haspopup="menu"
				aria-expanded={ menuOpen }
				aria-controls="date-range-selector-menu"
			>
				{ currentDateRangeLabel }
			</Button>
			<Menu
				ref={ menuRef }
				menuOpen={ menuOpen }
				menuItems={ menuItems }
				onSelected={ handleMenuItemSelect }
				id="date-range-selector-menu" />
		</div>
	);
}

export default DateRangeSelector;
