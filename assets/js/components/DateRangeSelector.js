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
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { useCallback, useRef, useState } from '@wordpress/element';
import { ESCAPE, TAB } from '@wordpress/keycodes';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { useSelect, useDispatch } from 'googlesitekit-data';
import { Menu, Button } from 'googlesitekit-components';
import DateRangeIcon from '../../svg/icons/date-range.svg';
import { CORE_USER } from '../googlesitekit/datastore/user/constants';
import { useKeyCodesInside } from '../hooks/useKeyCodesInside';
import { getAvailableDateRanges } from '../util/date-range';
import { trackEvent } from '../util';
import { CORE_UI } from '../googlesitekit/datastore/ui/constants';
import useViewContext from '../hooks/useViewContext';

export default function DateRangeSelector() {
	const ranges = getAvailableDateRanges();
	const dateRange = useSelect( ( select ) =>
		select( CORE_USER ).getDateRange()
	);
	const { setDateRange } = useDispatch( CORE_USER );
	const { resetInViewHook } = useDispatch( CORE_UI );

	const [ menuOpen, setMenuOpen ] = useState( false );
	const menuWrapperRef = useRef();
	const viewContext = useViewContext();

	useClickAway( menuWrapperRef, () => setMenuOpen( false ) );

	useKeyCodesInside( [ ESCAPE, TAB ], menuWrapperRef, () =>
		setMenuOpen( false )
	);

	const handleMenu = useCallback( () => {
		setMenuOpen( ! menuOpen );
	}, [ menuOpen ] );

	const handleMenuItemSelect = useCallback(
		( index ) => {
			const newDateRange = Object.values( ranges )[ index ].slug;

			if ( dateRange !== newDateRange ) {
				trackEvent(
					`${ viewContext }_headerbar`,
					'change_daterange',
					newDateRange
				);
			}

			resetInViewHook();
			setDateRange( newDateRange );
			setMenuOpen( false );
		},
		[ ranges, dateRange, resetInViewHook, setDateRange, viewContext ]
	);

	const currentDateRangeLabel = ranges[ dateRange ]?.label;
	const menuItems = Object.values( ranges ).map( ( range ) => range.label );

	return (
		<div
			ref={ menuWrapperRef }
			className="googlesitekit-date-range-selector googlesitekit-dropdown-menu mdc-menu-surface--anchor"
		>
			<Button
				className={ classnames(
					'mdc-button--dropdown',
					'googlesitekit-header__dropdown',
					'googlesitekit-header__date-range-selector-menu',
					'googlesitekit-border-radius-round--phone',
					'googlesitekit-button-icon--phone'
				) }
				text
				onClick={ handleMenu }
				icon={ <DateRangeIcon width="20" height="20" /> }
				aria-haspopup="menu"
				aria-expanded={ menuOpen }
				aria-controls="date-range-selector-menu"
				title={ __( 'Date range', 'google-site-kit' ) }
				tooltip
				tooltipEnterDelayInMS={ 500 }
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
