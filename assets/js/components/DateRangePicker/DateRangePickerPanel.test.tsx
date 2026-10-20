/**
 * DateRangePickerPanel component tests.
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
import { fireEvent, render, waitFor } from '@tests/js/test-utils';
import DateRangePickerPanel from './DateRangePickerPanel';

describe( 'DateRangePickerPanel', () => {
	const onApply = jest.fn();
	const onClose = jest.fn();

	beforeEach( () => {
		onApply.mockClear();
		onClose.mockClear();
	} );

	function renderPanel() {
		const triggerWrapper = document.createElement( 'div' );
		const trigger = document.createElement( 'button' );
		triggerWrapper.appendChild( trigger );
		document.body.appendChild( triggerWrapper );

		const result = render(
			<DateRangePickerPanel
				anchorTop={ 100 }
				anchorLeft={ 200 }
				triggerWrapperRef={ { current: triggerWrapper } }
				onApply={ onApply }
				onClose={ onClose }
			/>
		);

		return { ...result, trigger };
	}

	it( 'should render a dialog with an accessible name', () => {
		const { getByRole } = renderPanel();

		expect(
			getByRole( 'dialog', { name: 'Select date range' } )
		).toBeInTheDocument();
	} );

	it( 'should position itself from the anchor offsets', () => {
		const { getByRole } = renderPanel();
		const dialog = getByRole( 'dialog' );

		expect(
			dialog.style.getPropertyValue(
				'--googlesitekit-date-picker-panel-top'
			)
		).toBe( '100px' );
		expect(
			dialog.style.getPropertyValue(
				'--googlesitekit-date-picker-panel-left'
			)
		).toBe( '200px' );
	} );

	it( 'should move focus into the panel and keep it there', async () => {
		const { getByRole } = renderPanel();
		const dialog = getByRole( 'dialog' );

		await waitFor( () =>
			expect(
				dialog.contains( dialog.ownerDocument.activeElement )
			).toBe( true )
		);

		// Tabbing past the last control wraps back inside the panel.
		fireEvent.keyDown( dialog.ownerDocument.activeElement as Element, {
			key: 'Tab',
			keyCode: 9,
		} );
		fireEvent.keyDown( dialog.ownerDocument.activeElement as Element, {
			key: 'Tab',
			keyCode: 9,
		} );
		fireEvent.keyDown( dialog.ownerDocument.activeElement as Element, {
			key: 'Tab',
			keyCode: 9,
		} );

		expect( dialog.contains( dialog.ownerDocument.activeElement ) ).toBe(
			true
		);
	} );

	it( 'should call onClose when Cancel is pressed', () => {
		const { getByRole } = renderPanel();

		fireEvent.click( getByRole( 'button', { name: 'Cancel' } ) );

		expect( onClose ).toHaveBeenCalledTimes( 1 );
		expect( onApply ).not.toHaveBeenCalled();
	} );

	it( 'should call onApply when Apply is pressed', () => {
		const { getByRole } = renderPanel();

		fireEvent.click( getByRole( 'button', { name: 'Apply' } ) );

		expect( onApply ).toHaveBeenCalledTimes( 1 );
		expect( onClose ).not.toHaveBeenCalled();
	} );

	it( 'should call onClose when Escape is pressed inside the panel', () => {
		const { getByRole } = renderPanel();

		fireEvent.keyDown( getByRole( 'dialog' ), { keyCode: 27 } );

		expect( onClose ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'should call onClose when clicking outside the panel', () => {
		renderPanel();

		fireEvent.mouseDown( document.body );

		expect( onClose ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'should not call onClose when clicking the trigger, leaving that to the trigger', () => {
		const { trigger } = renderPanel();

		fireEvent.mouseDown( trigger );

		expect( onClose ).not.toHaveBeenCalled();
	} );

	it( 'should disable Apply when isApplyDisabled is set', () => {
		const { getByRole } = render(
			<DateRangePickerPanel
				anchorTop={ 0 }
				anchorLeft={ 0 }
				triggerWrapperRef={ { current: null } }
				onApply={ onApply }
				onClose={ onClose }
				isApplyDisabled
			/>
		);

		expect( getByRole( 'button', { name: 'Apply' } ) ).toBeDisabled();
	} );
} );
