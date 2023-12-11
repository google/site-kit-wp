/**
 * `useLatestIntersection` hook tests.
 *
 * Site Kit by Google, Copyright 2023 Google LLC
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
import { intersectionObserver } from '@shopify/jest-dom-mocks';

/**
 * WordPress dependencies
 */
import { createRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { act, actHook, render, renderHook } from '../../../tests/js/test-utils';
import useLatestIntersection from './useLatestIntersection';

describe( 'useLatestIntersection', () => {
	const container = global.document.createElement( 'div' );
	let targetRef;

	beforeEach( () => {
		intersectionObserver.mock();
		const IO = global.IntersectionObserver;
		jest.spyOn( IO.prototype, 'disconnect' );
		global.IntersectionObserver = jest.fn(
			( ...args ) => new IO( ...args )
		);
		global.IntersectionObserver.prototype = IO.prototype;
	} );

	afterEach( () => {
		intersectionObserver.restore();
	} );

	it( 'should setup an IntersectionObserver targeting the ref element and using the options provided', () => {
		act( () => {
			targetRef = createRef();
			render( <div ref={ targetRef } />, container );
		} );

		expect( intersectionObserver.observers ).toHaveLength( 0 );
		const observerOptions = { root: null, threshold: 0.8 };

		renderHook( () => useLatestIntersection( targetRef, observerOptions ) );

		expect( intersectionObserver.observers ).toHaveLength( 1 );
		expect( intersectionObserver.observers[ 0 ].target ).toEqual(
			targetRef.current
		);
		expect( intersectionObserver.observers[ 0 ].options ).toEqual(
			observerOptions
		);
	} );

	it( 'should return null if a ref without a current value is provided', () => {
		targetRef = createRef();

		const { result } = renderHook( () =>
			useLatestIntersection( targetRef, { root: null, threshold: 1 } )
		);
		expect( result.current ).toBe( null );
	} );

	it( 'should reset an intersectionObserverEntry when the ref changes', () => {
		act( () => {
			targetRef = createRef();
			render( <div ref={ targetRef } />, container );
		} );

		const { result, rerender } = renderHook( () =>
			useLatestIntersection( targetRef, {
				root: container,
				threshold: 0.8,
			} )
		);

		const mockIntersectionObserverEntry = {
			boundingClientRect: targetRef.current.getBoundingClientRect(),
			intersectionRatio: 0.81,
			intersectionRect: container.getBoundingClientRect(),
			isIntersecting: true,
			rootBounds: container.getBoundingClientRect(),
			target: targetRef.current,
			time: 300,
		};
		actHook( () => {
			intersectionObserver.simulate( mockIntersectionObserverEntry );
		} );

		expect( result.current ).toEqual( mockIntersectionObserverEntry );

		targetRef.current = global.document.createElement( 'div' );
		rerender();

		expect( result.current ).toEqual( null );
	} );

	it( 'should return null if IntersectionObserver is not supported', () => {
		targetRef = createRef();
		targetRef.current = global.document.createElement( 'div' );
		delete global.IntersectionObserver;

		expect( () =>
			renderHook( () => useLatestIntersection( targetRef, {} ) )
		).not.toThrow();
	} );

	it( 'should disconnect an old IntersectionObserver instance when the ref changes', () => {
		targetRef = createRef();
		targetRef.current = global.document.createElement( 'div' );

		const { rerender } = renderHook( () =>
			useLatestIntersection( targetRef, {} )
		);

		targetRef.current = global.document.createElement( 'div' );
		rerender();

		targetRef.current = null;
		rerender();

		expect( IntersectionObserver ).toHaveBeenCalledTimes( 2 );
		expect(
			IntersectionObserver.prototype.disconnect
		).toHaveBeenCalledTimes( 2 );
	} );

	it( 'should return the last IntersectionObserverEntry when the IntersectionObserver registers an intersection', () => {
		act( () => {
			targetRef = createRef();
			render( <div ref={ targetRef } />, container );
		} );

		const { result } = renderHook( () =>
			useLatestIntersection( targetRef, {
				root: container,
				threshold: 0.3,
			} )
		);

		const mockIntersectionObserverEntry1 = {
			boundingClientRect: targetRef.current.getBoundingClientRect(),
			intersectionRatio: 0.31,
			intersectionRect: container.getBoundingClientRect(),
			isIntersecting: true,
			rootBounds: container.getBoundingClientRect(),
			target: targetRef.current,
			time: 300,
		};

		const mockIntersectionObserverEntry2 = {
			boundingClientRect: targetRef.current.getBoundingClientRect(),
			intersectionRatio: 0.61,
			intersectionRect: container.getBoundingClientRect(),
			isIntersecting: true,
			rootBounds: container.getBoundingClientRect(),
			target: targetRef.current,
			time: 400,
		};
		actHook( () => {
			intersectionObserver.simulate( [
				mockIntersectionObserverEntry1,
				mockIntersectionObserverEntry2,
			] );
		} );
		expect( result.current ).toEqual( mockIntersectionObserverEntry2 );
	} );

	it( 'should setup a new IntersectionObserver when the ref changes', () => {
		let newRef;
		act( () => {
			targetRef = createRef();
			newRef = createRef();
			render(
				<div ref={ targetRef }>
					<span ref={ newRef } />
				</div>,
				container
			);
		} );

		const observerOptions = { root: null, threshold: 0.8 };
		const { rerender } = renderHook(
			( { refToUse, options } ) =>
				useLatestIntersection( refToUse, options ),
			{
				initialProps: { refToUse: targetRef, options: observerOptions },
			}
		);

		expect( intersectionObserver.observers[ 0 ].target ).toEqual(
			targetRef.current
		);

		actHook( () => {
			rerender( { refToUse: newRef, options: observerOptions } );
		} );

		expect( intersectionObserver.observers[ 0 ].target ).toEqual(
			newRef.current
		);
	} );

	it( 'should setup a new IntersectionObserver when the options change', () => {
		act( () => {
			targetRef = createRef();
			render( <div ref={ targetRef } />, container );
		} );

		const initialObserverOptions = { root: null, threshold: 0.8 };
		const { rerender } = renderHook(
			( { refToUse, options } ) =>
				useLatestIntersection( refToUse, options ),
			{
				initialProps: {
					refToUse: targetRef,
					options: initialObserverOptions,
				},
			}
		);

		expect( intersectionObserver.observers[ 0 ].options ).toEqual(
			initialObserverOptions
		);

		const newObserverOptions = { root: container, threshold: 1 };
		act( () => {
			rerender( { refToUse: targetRef, options: newObserverOptions } );
		} );

		expect( intersectionObserver.observers[ 0 ].options ).toEqual(
			newObserverOptions
		);
	} );
} );
