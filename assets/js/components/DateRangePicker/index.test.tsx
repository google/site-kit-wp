/**
 * DateRangePicker component tests.
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
 * Internal dependencies
 */
import { CORE_FORMS } from '@/js/googlesitekit/datastore/forms/constants';
import { CORE_UI } from '@/js/googlesitekit/datastore/ui/constants';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import {
	act,
	createTestRegistry,
	fireEvent,
	render,
	waitFor,
} from '@tests/js/test-utils';
import {
	DATE_RANGE_PICKER_PANEL_ID,
	FORM_DATE_RANGE_PICKER,
	FORM_KEY_SELECTION,
} from './constants';
import DateRangePicker from './index';

describe( 'DateRangePicker', () => {
	let registry: ReturnType< typeof createTestRegistry >;

	beforeEach( () => {
		registry = createTestRegistry();
		registry.dispatch( CORE_USER ).setReferenceDate( '2026-08-31' );
	} );

	function getDraftSelection() {
		return registry
			.select( CORE_FORMS )
			.getValue( FORM_DATE_RANGE_PICKER, FORM_KEY_SELECTION );
	}

	function openPanel(
		getByRole: ReturnType< typeof render >[ 'getByRole' ]
	) {
		fireEvent.click( getByRole( 'button', { name: /Aug 4, 2026/ } ) );
	}

	describe( 'trigger', () => {
		it( 'should render the selected range as dates, with the leading icon and dropdown affordance', () => {
			const { getByRole } = render( <DateRangePicker />, { registry } );

			const trigger = getByRole( 'button', {
				name: 'Aug 4, 2026 - Aug 31, 2026',
			} );

			expect( trigger ).toHaveTextContent( 'Aug 4, 2026 - Aug 31, 2026' );
			expect( trigger.querySelector( 'svg' ) ).toBeInTheDocument();
			expect( trigger ).toHaveClass( 'mdc-button--dropdown' );
		} );

		it( 'should render dates for a calendar month selection', () => {
			registry.dispatch( CORE_USER ).setDateRangeSelection( {
				type: 'calendarMonth',
				month: '2026-07',
			} );

			const { getByRole } = render( <DateRangePicker />, { registry } );

			expect(
				getByRole( 'button', { name: 'Jul 1, 2026 - Jul 31, 2026' } )
			).toBeInTheDocument();
		} );

		it( 'should render dates for a custom selection', () => {
			registry.dispatch( CORE_USER ).setDateRangeSelection( {
				type: 'custom',
				startDate: '2026-03-02',
				endDate: '2026-04-15',
			} );

			const { getByRole } = render( <DateRangePicker />, { registry } );

			expect(
				getByRole( 'button', { name: 'Mar 2, 2026 - Apr 15, 2026' } )
			).toBeInTheDocument();
		} );

		it( 'should expose the expected ARIA attributes', () => {
			const { getByRole } = render( <DateRangePicker />, { registry } );
			const trigger = getByRole( 'button', { name: /Aug 4, 2026/ } );

			expect( trigger ).toHaveAttribute( 'aria-haspopup', 'dialog' );
			expect( trigger ).toHaveAttribute( 'aria-expanded', 'false' );
			expect( trigger ).toHaveAttribute(
				'aria-controls',
				DATE_RANGE_PICKER_PANEL_ID
			);

			openPanel( getByRole );

			expect( trigger ).toHaveAttribute( 'aria-expanded', 'true' );
		} );
	} );

	describe( 'panel', () => {
		it( 'should open from the trigger as a named dialog', () => {
			const { getByRole, queryByRole } = render( <DateRangePicker />, {
				registry,
			} );

			expect( queryByRole( 'dialog' ) ).not.toBeInTheDocument();

			openPanel( getByRole );

			expect(
				getByRole( 'dialog', { name: 'Select date range' } )
			).toBeInTheDocument();
		} );

		it.each( [
			[
				'Cancel',
				( getByRole: ReturnType< typeof render >[ 'getByRole' ] ) =>
					fireEvent.click(
						getByRole( 'button', { name: 'Cancel' } )
					),
			],
			[
				'Escape',
				( getByRole: ReturnType< typeof render >[ 'getByRole' ] ) =>
					fireEvent.keyDown( getByRole( 'dialog' ), {
						keyCode: 27,
					} ),
			],
			[ 'an outside click', () => fireEvent.mouseDown( document.body ) ],
			[
				'the trigger being pressed again',
				( getByRole: ReturnType< typeof render >[ 'getByRole' ] ) => {
					const trigger = getByRole( 'button', {
						name: /Aug 4, 2026/,
					} );
					fireEvent.mouseDown( trigger );
					fireEvent.click( trigger );
				},
			],
		] )( 'should close via %s', ( _, close ) => {
			const { getByRole, queryByRole } = render( <DateRangePicker />, {
				registry,
			} );

			openPanel( getByRole );
			expect( getByRole( 'dialog' ) ).toBeInTheDocument();

			close( getByRole );

			expect( queryByRole( 'dialog' ) ).not.toBeInTheDocument();
		} );

		it( 'should move focus into the panel, trap it, and return it to the trigger on close', async () => {
			const { getByRole } = render( <DateRangePicker />, { registry } );
			const trigger = getByRole( 'button', { name: /Aug 4, 2026/ } );

			trigger.focus();
			fireEvent.click( trigger );

			const dialog = getByRole( 'dialog' );
			await waitFor( () =>
				expect(
					dialog.contains( dialog.ownerDocument.activeElement )
				).toBe( true )
			);

			for ( let index = 0; index < 3; index++ ) {
				fireEvent.keyDown(
					dialog.ownerDocument.activeElement as Element,
					{
						key: 'Tab',
						keyCode: 9,
					}
				);
			}
			expect(
				dialog.contains( dialog.ownerDocument.activeElement )
			).toBe( true );

			fireEvent.click( getByRole( 'button', { name: 'Cancel' } ) );

			await waitFor( () => expect( trigger ).toHaveFocus() );
		} );
	} );

	describe( 'draft', () => {
		it( 'should seed from the committed selection when opened', () => {
			const { getByRole } = render( <DateRangePicker />, { registry } );

			expect( getDraftSelection() ).toBeUndefined();

			openPanel( getByRole );

			expect( getDraftSelection() ).toEqual( {
				type: 'preset',
				slug: 'last-28-days',
			} );
		} );

		it( 'should discard the draft when closed without applying, and re-seed on reopen', () => {
			const { getByRole } = render( <DateRangePicker />, { registry } );

			openPanel( getByRole );
			act( () => {
				registry
					.dispatch( CORE_FORMS )
					.setValues( FORM_DATE_RANGE_PICKER, {
						[ FORM_KEY_SELECTION ]: {
							type: 'preset',
							slug: 'last-7-days',
						},
					} );
			} );

			fireEvent.click( getByRole( 'button', { name: 'Cancel' } ) );

			expect( getDraftSelection() ).toBeUndefined();
			expect(
				registry.select( CORE_USER ).getDateRangeSelection()
			).toEqual( {
				type: 'preset',
				slug: 'last-28-days',
			} );

			openPanel( getByRole );

			expect( getDraftSelection() ).toEqual( {
				type: 'preset',
				slug: 'last-28-days',
			} );
		} );
	} );

	describe( 'Apply', () => {
		it( 'should commit the draft, reset the in-view hook and close the panel', () => {
			const resetInViewHook = jest.spyOn(
				registry.dispatch( CORE_UI ),
				'resetInViewHook'
			);
			const { getByRole, queryByRole } = render( <DateRangePicker />, {
				registry,
			} );

			openPanel( getByRole );
			act( () => {
				registry
					.dispatch( CORE_FORMS )
					.setValues( FORM_DATE_RANGE_PICKER, {
						[ FORM_KEY_SELECTION ]: {
							type: 'preset',
							slug: 'last-7-days',
						},
					} );
			} );

			fireEvent.click( getByRole( 'button', { name: 'Apply' } ) );

			expect(
				registry.select( CORE_USER ).getDateRangeSelection()
			).toEqual( {
				type: 'preset',
				slug: 'last-7-days',
			} );
			expect( resetInViewHook ).toHaveBeenCalledTimes( 1 );
			expect( queryByRole( 'dialog' ) ).not.toBeInTheDocument();
			expect(
				getByRole( 'button', { name: 'Aug 25, 2026 - Aug 31, 2026' } )
			).toBeInTheDocument();
		} );

		it( 'should close without committing when the selection is unchanged', () => {
			const resetInViewHook = jest.spyOn(
				registry.dispatch( CORE_UI ),
				'resetInViewHook'
			);
			const setDateRangeSelection = jest.spyOn(
				registry.dispatch( CORE_USER ),
				'setDateRangeSelection'
			);
			const { getByRole, queryByRole } = render( <DateRangePicker />, {
				registry,
			} );

			openPanel( getByRole );
			fireEvent.click( getByRole( 'button', { name: 'Apply' } ) );

			expect( setDateRangeSelection ).not.toHaveBeenCalled();
			expect( resetInViewHook ).not.toHaveBeenCalled();
			expect( queryByRole( 'dialog' ) ).not.toBeInTheDocument();
		} );
	} );
} );
