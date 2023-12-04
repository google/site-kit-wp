/**
 * `useKeyCodesInside` hook tests.
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
 * WordPress dependencies
 */
import { useRef } from '@wordpress/element';
import { ENTER, ESCAPE, SPACE, TAB } from '@wordpress/keycodes';

/**
 * Internal dependencies
 */
import { render, fireEvent } from '../../../tests/js/test-utils';
import { useKeyCodesInside } from './useKeyCodesInside';

function TestComponent( { onKeyCodeInside } ) {
	const wrapperRef = useRef();
	useKeyCodesInside( [ ESCAPE, TAB ], wrapperRef, onKeyCodeInside );

	return <div ref={ wrapperRef }>TestComponent</div>;
}

describe( 'useKeyCodesInside', () => {
	let getByText;
	let testComponent;
	const onKeyCodeInsideMock = jest.fn();
	beforeEach( () => {
		onKeyCodeInsideMock.mockReset();
		getByText = render(
			<TestComponent onKeyCodeInside={ onKeyCodeInsideMock } />
		).getByText;
		testComponent = getByText( 'TestComponent' );
	} );

	it( 'should call handler when included keycode is pressed inside ref', () => {
		expect( onKeyCodeInsideMock ).not.toHaveBeenCalled();

		fireEvent.keyDown( testComponent, { keyCode: ESCAPE } );

		expect( onKeyCodeInsideMock ).toHaveBeenCalled();

		fireEvent.keyDown( testComponent, { keyCode: TAB } );

		expect( onKeyCodeInsideMock ).toHaveBeenCalledTimes( 2 );
	} );

	it( 'should not call handler when included keycode is pressed outside ref', () => {
		expect( onKeyCodeInsideMock ).not.toHaveBeenCalled();

		fireEvent.keyDown( document, { keyCode: ESCAPE } );
		fireEvent.keyDown( document, { keyCode: TAB } );

		expect( onKeyCodeInsideMock ).not.toHaveBeenCalled();
	} );

	it( 'should not call handler when another keycode is pressed inside or outside ref', () => {
		expect( onKeyCodeInsideMock ).not.toHaveBeenCalled();

		// We only listen for `ESCAPE` and `TAB`, so these should never trigger.
		fireEvent.keyDown( testComponent, { keyCode: ENTER } );
		fireEvent.keyDown( testComponent, { keyCode: SPACE } );
		fireEvent.keyDown( document, { keyCode: ENTER } );
		fireEvent.keyDown( document, { keyCode: SPACE } );

		expect( onKeyCodeInsideMock ).not.toHaveBeenCalled();
	} );
} );
