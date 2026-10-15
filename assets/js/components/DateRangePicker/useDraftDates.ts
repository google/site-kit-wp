/**
 * `useDraftDates` hook.
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
import { isEqual } from 'lodash';

/**
 * WordPress dependencies
 */
import { useCallback } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { Select, useDispatch, useSelect } from 'googlesitekit-data';
import { CORE_FORMS } from '@/js/googlesitekit/datastore/forms/constants';
import { CORE_UI } from '@/js/googlesitekit/datastore/ui/constants';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import useFormValue from '@/js/hooks/useFormValue';
import {
	DateRangeSelection,
	isValidDateRangeSelection,
	resolveDateRangeSelection,
} from '@/js/util/dates';
import {
	FOCUS_TARGET_START_DATE,
	FORM_DATE_RANGE_PICKER,
	FORM_KEY_FOCUS_TARGET,
	FORM_KEY_SELECTION,
	FORM_KEY_VISIBLE_MONTH,
} from './constants';

export interface DraftDates {
	selection: DateRangeSelection | undefined;
	setSelection: ( selection: DateRangeSelection ) => void;
	focusTarget: string | undefined;
	setFocusTarget: ( focusTarget: string ) => void;
	visibleMonth: string | undefined;
	setVisibleMonth: ( visibleMonth: string ) => void;
	isDraftValid: boolean;
	seedDraft: () => void;
	discardDraft: () => void;
	applyDraft: () => void;
}

/**
 * Holds the date range being edited in the picker panel, separately from the
 * range the dashboard is reporting over.
 *
 * @since n.e.x.t
 *
 * @return {DraftDates} The draft values with their setters, and the actions to seed, discard and apply the draft.
 */
export function useDraftDates(): DraftDates {
	const [ selection, setSelection ] = useFormValue< DateRangeSelection >(
		FORM_DATE_RANGE_PICKER,
		FORM_KEY_SELECTION
	);
	const [ focusTarget, setFocusTarget ] = useFormValue< string >(
		FORM_DATE_RANGE_PICKER,
		FORM_KEY_FOCUS_TARGET
	);
	const [ visibleMonth, setVisibleMonth ] = useFormValue< string >(
		FORM_DATE_RANGE_PICKER,
		FORM_KEY_VISIBLE_MONTH
	);

	const committedSelection = useSelect(
		( select: Select ) => select( CORE_USER ).getDateRangeSelection(),
		[]
	) as DateRangeSelection;
	const referenceDate = useSelect(
		( select: Select ) => select( CORE_USER ).getReferenceDate(),
		[]
	) as string;

	const { setValues } = useDispatch( CORE_FORMS );
	const { setDateRangeSelection } = useDispatch( CORE_USER );
	const { resetInViewHook } = useDispatch( CORE_UI );

	const seedDraft = useCallback( () => {
		const { startDate } = resolveDateRangeSelection(
			committedSelection,
			referenceDate
		);

		setValues( FORM_DATE_RANGE_PICKER, {
			[ FORM_KEY_SELECTION ]: committedSelection,
			[ FORM_KEY_FOCUS_TARGET ]: FOCUS_TARGET_START_DATE,
			[ FORM_KEY_VISIBLE_MONTH ]: startDate.slice( 0, 7 ),
		} );
	}, [ committedSelection, referenceDate, setValues ] );

	const discardDraft = useCallback( () => {
		setValues( FORM_DATE_RANGE_PICKER, {
			[ FORM_KEY_SELECTION ]: undefined,
			[ FORM_KEY_FOCUS_TARGET ]: undefined,
			[ FORM_KEY_VISIBLE_MONTH ]: undefined,
		} );
	}, [ setValues ] );

	const isDraftValid = isValidDateRangeSelection( selection, referenceDate );

	const applyDraft = useCallback( () => {
		if ( ! isDraftValid || isEqual( selection, committedSelection ) ) {
			return;
		}

		resetInViewHook();
		setDateRangeSelection( selection );
	}, [
		isDraftValid,
		selection,
		committedSelection,
		resetInViewHook,
		setDateRangeSelection,
	] );

	return {
		selection,
		setSelection,
		focusTarget,
		setFocusTarget,
		visibleMonth,
		setVisibleMonth,
		isDraftValid,
		seedDraft,
		discardDraft,
		applyDraft,
	};
}
