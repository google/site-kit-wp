/**
 * `useInViewSelect` hook tests.
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
 * Internal dependencies
 */
import {
	actHook as act,
	createTestRegistry,
	renderHook,
} from '../../../tests/js/test-utils';
import { CORE_UI } from '../googlesitekit/datastore/ui/constants';
import { useInViewSelect } from './useInViewSelect';

describe( 'useInViewSelect', () => {
	it( 'should return the correct value from useInViewSelect when a parent <InViewProvider /> has a `true` value', () => {
		const registry = createTestRegistry();

		registry.dispatch( CORE_UI ).setValue( 'test', '123' );

		const mapSelectMock = jest.fn( ( select ) =>
			select( CORE_UI ).getValue( 'test' )
		);

		const { result } = renderHook( () => useInViewSelect( mapSelectMock ), {
			inView: true,
			registry,
		} );

		expect( result.current ).toBe( '123' );
		expect( mapSelectMock ).toHaveBeenCalledTimes( 2 );
	} );

	it( 'should return undefined when a parent <InViewProvider /> has a `false` value', () => {
		const registry = createTestRegistry();

		registry.dispatch( CORE_UI ).setValue( 'test', '123' );

		const mapSelectMock = jest.fn( ( select ) =>
			select( CORE_UI ).getValue( 'test' )
		);

		const { result } = renderHook( () => useInViewSelect( mapSelectMock ), {
			inView: false,
			registry,
		} );

		expect( result.current ).toBe( undefined );
		expect( mapSelectMock ).toHaveBeenCalledTimes( 0 );
	} );

	it( 'should update and return a value after a parent <InViewProvider /> changes from `false` to `true`', () => {
		const registry = createTestRegistry();

		registry.dispatch( CORE_UI ).setValue( 'test', '123' );

		const mapSelectMock = jest.fn( ( select ) =>
			select( CORE_UI ).getValue( 'test' )
		);

		const { result, setInView } = renderHook(
			() => useInViewSelect( mapSelectMock ),
			{ inView: false, registry }
		);

		// Should be undefined at first.
		expect( result.current ).toBe( undefined );
		expect( mapSelectMock ).toHaveBeenCalledTimes( 0 );

		// Mark the provider as in-view.
		act( () => setInView( true ) );

		// Now the selector should be run and return the correct value.
		expect( result.current ).toBe( '123' );
		expect( mapSelectMock ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'should continue to return values from a selector after the <InViewProvider /> changes from `true` to `false`', () => {
		const registry = createTestRegistry();

		registry.dispatch( CORE_UI ).setValue( 'test', '123' );

		const mapSelectMock = jest.fn( ( select ) =>
			select( CORE_UI ).getValue( 'test' )
		);

		const { result, setInView } = renderHook(
			() => useInViewSelect( mapSelectMock ),
			{ inView: true, registry }
		);

		expect( result.current ).toBe( '123' );
		expect( mapSelectMock ).toHaveBeenCalledTimes( 2 );

		act( () => setInView( false ) );

		// The selector should still be run and return the correct value.
		expect( result.current ).toBe( '123' );
		expect( mapSelectMock ).toHaveBeenCalledTimes( 2 );
	} );

	it( 'should continue to return values from a selector after the <InViewProvider /> changes from `true` to `false` across an inView reset', async () => {
		const registry = createTestRegistry();

		registry.dispatch( CORE_UI ).setValue( 'test', '123' );

		const mapSelectMock = jest.fn( ( select ) =>
			select( CORE_UI ).getValue( 'test' )
		);

		const { result, rerender, setInView } = renderHook(
			() => useInViewSelect( mapSelectMock ),
			{ inView: true, registry }
		);

		expect( result.current ).toBe( '123' );
		expect( mapSelectMock ).toHaveBeenCalledTimes( 2 );

		act( () => setInView( false ) );
		await act( () => registry.dispatch( CORE_UI ).resetInViewHook() );

		// The selector should still be run and return the correct value.
		expect( result.current ).toBe( '123' );
		expect( mapSelectMock ).toHaveBeenCalledTimes( 3 );

		await act( () =>
			registry.dispatch( CORE_UI ).setValue( 'test', '999' )
		);
		rerender();

		// The result is the same because the inView state is false.
		expect( result.current ).toBe( '123' );
		expect( mapSelectMock ).toHaveBeenCalledTimes( 3 );

		act( () => setInView( true ) );

		// The result updates to the value in the datastore once it is in view again.
		expect( result.current ).toBe( '999' );
		expect( mapSelectMock ).toHaveBeenCalledTimes( 4 );
	} );
} );
