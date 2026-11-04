/**
 * `useKeyInside` hook tests.
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
import { fireEvent, renderHook } from '@tests/js/test-utils';
import { useKeyInside } from './useKeyInside';

describe( 'useKeyInside', () => {
	it( 'should handle events on the element and its descendants, but not outside it', () => {
		const container = document.createElement( 'div' );
		const child = document.createElement( 'button' );

		container.appendChild( child );

		const handler = jest.fn();

		renderHook( () =>
			useKeyInside( 'Escape', { current: container }, handler )
		);

		fireEvent.keyDown( container, { key: 'Escape' } );
		fireEvent.keyDown( child, { key: 'Escape' } );
		fireEvent.keyDown( child, { key: 'Enter' } );
		fireEvent.keyDown( document.body, { key: 'Escape' } );

		expect( handler ).toHaveBeenCalledTimes( 2 );

		expect( handler ).toHaveBeenNthCalledWith(
			1,
			expect.objectContaining( { key: 'Escape', target: container } )
		);

		expect( handler ).toHaveBeenNthCalledWith(
			2,
			expect.objectContaining( { key: 'Escape', target: child } )
		);
	} );

	it( 'should use the latest handler and remove it on unmount', () => {
		const ref = { current: document.createElement( 'div' ) };

		const firstHandler = jest.fn();
		const nextHandler = jest.fn();

		const { rerender, unmount } = renderHook(
			( { handler } ) => useKeyInside( 'Escape', ref, handler ),
			{ initialProps: { handler: firstHandler } }
		);

		rerender( { handler: nextHandler } );

		fireEvent.keyDown( ref.current, { key: 'Escape' } );

		expect( firstHandler ).not.toHaveBeenCalled();
		expect( nextHandler ).toHaveBeenCalledTimes( 1 );

		unmount();

		fireEvent.keyDown( ref.current, { key: 'Escape' } );

		expect( nextHandler ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'should respond to an updated key', () => {
		const ref = { current: document.createElement( 'div' ) };

		const handler = jest.fn();

		const { rerender } = renderHook(
			( { key } ) => useKeyInside( key, ref, handler ),
			{ initialProps: { key: 'Escape' } }
		);

		rerender( { key: 'Tab' } );

		fireEvent.keyDown( ref.current, { key: 'Escape' } );

		expect( handler ).not.toHaveBeenCalled();

		fireEvent.keyDown( ref.current, { key: 'Tab' } );

		expect( handler ).toHaveBeenCalledTimes( 1 );
	} );
} );
