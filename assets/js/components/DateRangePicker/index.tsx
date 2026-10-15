/**
 * DateRangePicker component.
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
import classnames from 'classnames';
import { FC, useCallback, useRef, useState } from 'react';

/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { Select, useSelect } from 'googlesitekit-data';
import { Button } from '@/js/googlesitekit-components';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import {
	DateRangeSelection,
	formatDate,
	resolveDateRangeSelection,
} from '@/js/util/dates';
import DateRangeIcon from '@/svg/icons/date-range.svg';
import {
	DATE_RANGE_PICKER_PANEL_GAP,
	DATE_RANGE_PICKER_PANEL_ID,
	DATE_RANGE_PICKER_PANEL_VIEWPORT_MARGIN,
	DATE_RANGE_PICKER_PANEL_WIDTH,
} from './constants';
import DateRangePickerPanel from './DateRangePickerPanel';
import { useDraftDates } from './useDraftDates';

const DateRangePicker: FC = () => {
	const triggerWrapperRef = useRef< HTMLDivElement >( null );
	const triggerButtonRef = useRef< HTMLButtonElement >( null );

	const [ isOpen, setIsOpen ] = useState( false );
	const [ anchor, setAnchor ] = useState( { top: 0, left: 0 } );

	const { isDraftValid, seedDraft, discardDraft, applyDraft } =
		useDraftDates();

	const selection = useSelect(
		( select: Select ) => select( CORE_USER ).getDateRangeSelection(),
		[]
	) as DateRangeSelection;
	const referenceDate = useSelect(
		( select: Select ) => select( CORE_USER ).getReferenceDate(),
		[]
	) as string;

	const { startDate, endDate } = resolveDateRangeSelection(
		selection,
		referenceDate
	);
	const label = sprintf(
		/* translators: 1: formatted start date, 2: formatted end date. */
		__( '%1$s - %2$s', 'google-site-kit' ),
		formatDate( startDate ),
		formatDate( endDate )
	);

	const closePanel = useCallback( () => {
		setIsOpen( false );
		discardDraft();
	}, [ discardDraft ] );

	const handleApply = useCallback( () => {
		applyDraft();
		closePanel();
	}, [ applyDraft, closePanel ] );

	const handleToggle = useCallback( () => {
		if ( isOpen ) {
			closePanel();
			return;
		}

		const triggerRect = triggerButtonRef.current?.getBoundingClientRect();
		const wrapperRect = triggerWrapperRef.current?.getBoundingClientRect();

		if ( triggerRect && wrapperRect ) {
			// Centre the panel on the trigger, then shift it inwards if it would
			// extend past the viewport edge. The panel is positioned within the
			// trigger's wrapper so it stays with the sticky header, so the offsets
			// are relative to that wrapper.
			const centredLeft =
				triggerRect.left +
				triggerRect.width / 2 -
				DATE_RANGE_PICKER_PANEL_WIDTH / 2;
			const minLeft = DATE_RANGE_PICKER_PANEL_VIEWPORT_MARGIN;
			const maxLeft =
				document.documentElement.clientWidth -
				DATE_RANGE_PICKER_PANEL_WIDTH -
				DATE_RANGE_PICKER_PANEL_VIEWPORT_MARGIN;

			setAnchor( {
				top:
					triggerRect.bottom -
					wrapperRect.top +
					DATE_RANGE_PICKER_PANEL_GAP,
				left:
					Math.max( minLeft, Math.min( centredLeft, maxLeft ) ) -
					wrapperRect.left,
			} );
		}

		seedDraft();
		setIsOpen( true );
	}, [ isOpen, closePanel, seedDraft ] );

	return (
		<div
			ref={ triggerWrapperRef }
			className="googlesitekit-date-range-selector googlesitekit-dropdown-menu mdc-menu-surface--anchor"
		>
			{ /* @ts-expect-error - The `Button` component is not typed yet. */ }
			<Button
				ref={ triggerButtonRef }
				className={ classnames(
					'mdc-button--dropdown',
					'googlesitekit-header__dropdown',
					'googlesitekit-header__date-range-selector-menu',
					'googlesitekit-border-radius-round--phone',
					'googlesitekit-button-icon--phone'
				) }
				onClick={ handleToggle }
				icon={ <DateRangeIcon width="20" height="20" /> }
				aria-haspopup="dialog"
				aria-expanded={ isOpen }
				aria-controls={ DATE_RANGE_PICKER_PANEL_ID }
				// The label is hidden at the smallest breakpoint, so name the
				// button explicitly to keep the range available to assistive tech.
				aria-label={ label }
				title={ __( 'Date range', 'google-site-kit' ) }
				tooltipEnterDelayInMS={ 500 }
				text
				tooltip
			>
				{ label }
			</Button>
			{ isOpen && (
				<DateRangePickerPanel
					anchorTop={ anchor.top }
					anchorLeft={ anchor.left }
					isApplyDisabled={ ! isDraftValid }
					triggerWrapperRef={ triggerWrapperRef }
					onApply={ handleApply }
					onClose={ closePanel }
				/>
			) }
		</div>
	);
};

export default DateRangePicker;
