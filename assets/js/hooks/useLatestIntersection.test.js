/**
 * `useLatestIntersection` hook tests.
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
import { intersectionObserver } from '@shopify/jest-dom-mocks';

/**
 * WordPress dependencies
 */
import { createRef, render } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { renderHook } from '../../../tests/js/test-utils';
import TestUtils from 'react-dom/test-utils';
// import TestRenderer from 'react-test-renderer';
import useLatestIntersection from './useLatestIntersection';

describe( 'useLatestIntersection', () => {
	const container = document.createElement( 'div' );
	let targetRef;

	beforeEach( () => {
		intersectionObserver.mock();
		const IO = IntersectionObserver;
		jest.spyOn( IO.prototype, 'disconnect' );
		jest.spyOn( global, 'IntersectionObserver' );
		IntersectionObserver.prototype = IO.prototype;
	} );

	afterEach( () => {
		intersectionObserver.restore();
	} );

	it( 'should setup an IntersectionObserver targeting the ref element and using the options provided', () => {
		TestUtils.act( () => {
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

	// it( 'should return null if a ref without a current value is provided', () => {
	// 	targetRef = createRef();

	// 	const { result } = renderHook( () =>
	// 		useLatestIntersection( targetRef, { root: null, threshold: 1 } )
	// 	);
	// 	expect( result.current ).toBe( null );
	// } );

	// it( 'should reset an intersectionObserverEntry when the ref changes', () => {
	// 	TestUtils.act( () => {
	// 		targetRef = createRef();
	// 		render( <div ref={ targetRef } />, container );
	// 	} );

	// 	const { result, rerender } = renderHook( () =>
	// 		useLatestIntersection( targetRef, {
	// 			root: container,
	// 			threshold: 0.8,
	// 		} )
	// 	);

	// 	const mockIntersectionObserverEntry = {
	// 		boundingClientRect: targetRef.current.getBoundingClientRect(),
	// 		intersectionRatio: 0.81,
	// 		intersectionRect: container.getBoundingClientRect(),
	// 		isIntersecting: true,
	// 		rootBounds: container.getBoundingClientRect(),
	// 		target: targetRef.current,
	// 		time: 300,
	// 	};
	// 	TestRenderer.act( () => {
	// 		intersectionObserver.simulate( mockIntersectionObserverEntry );
	// 	} );

	// 	expect( result.current ).toEqual( mockIntersectionObserverEntry );

	// 	targetRef.current = document.createElement( 'div' );
	// 	rerender();

	// 	expect( result.current ).toEqual( null );
	// } );

	// it( 'should return null if IntersectionObserver is not supported', () => {
	// 	targetRef = createRef();
	// 	targetRef.current = document.createElement( 'div' );
	// 	delete global.IntersectionObserver;

	// 	expect( () =>
	// 		renderHook( () => useLatestIntersection( targetRef, {} ) )
	// 	).not.toThrow();
	// } );

	// it( 'should disconnect an old IntersectionObserver instance when the ref changes', () => {
	// 	targetRef = createRef();
	// 	targetRef.current = document.createElement( 'div' );

	// 	const { rerender } = renderHook( () =>
	// 		useLatestIntersection( targetRef, {} )
	// 	);

	// 	targetRef.current = document.createElement( 'div' );
	// 	rerender();

	// 	targetRef.current = null;
	// 	rerender();

	// 	expect( IntersectionObserver ).toHaveBeenCalledTimes( 2 );
	// 	expect(
	// 		IntersectionObserver.prototype.disconnect
	// 	).toHaveBeenCalledTimes( 2 );
	// } );

	// it( 'should return the first IntersectionObserverEntry when the IntersectionObserver registers an intersection', () => {
	// 	TestUtils.act( () => {
	// 		targetRef = createRef();
	// 		render( <div ref={ targetRef } />, container );
	// 	} );

	// 	const { result } = renderHook( () =>
	// 		useLatestIntersection( targetRef, {
	// 			root: container,
	// 			threshold: 0.8,
	// 		} )
	// 	);

	// 	const mockIntersectionObserverEntry = {
	// 		boundingClientRect: targetRef.current.getBoundingClientRect(),
	// 		intersectionRatio: 0.81,
	// 		intersectionRect: container.getBoundingClientRect(),
	// 		isIntersecting: true,
	// 		rootBounds: container.getBoundingClientRect(),
	// 		target: targetRef.current,
	// 		time: 300,
	// 	};
	// 	TestRenderer.act( () => {
	// 		intersectionObserver.simulate( mockIntersectionObserverEntry );
	// 	} );

	// 	expect( result.current ).toEqual( mockIntersectionObserverEntry );
	// } );

	// it( 'should setup a new IntersectionObserver when the ref changes', () => {
	// 	let newRef;
	// 	TestUtils.act( () => {
	// 		targetRef = createRef();
	// 		newRef = createRef();
	// 		render(
	// 			<div ref={ targetRef }>
	// 				<span ref={ newRef } />
	// 			</div>,
	// 			container
	// 		);
	// 	} );

	// 	const observerOptions = { root: null, threshold: 0.8 };
	// 	const { rerender } = renderHook(
	// 		( { ref, options } ) => useLatestIntersection( ref, options ),
	// 		{
	// 			initialProps: { ref: targetRef, options: observerOptions },
	// 		}
	// 	);

	// 	expect( intersectionObserver.observers[ 0 ].target ).toEqual(
	// 		targetRef.current
	// 	);

	// 	TestRenderer.act( () => {
	// 		rerender( { ref: newRef, options: observerOptions } );
	// 	} );

	// 	expect( intersectionObserver.observers[ 0 ].target ).toEqual(
	// 		newRef.current
	// 	);
	// } );

	// it( 'should setup a new IntersectionObserver when the options change', () => {
	// 	TestUtils.act( () => {
	// 		targetRef = createRef();
	// 		render( <div ref={ targetRef } />, container );
	// 	} );

	// 	const initialObserverOptions = { root: null, threshold: 0.8 };
	// 	const { rerender } = renderHook(
	// 		( { ref, options } ) => useLatestIntersection( ref, options ),
	// 		{
	// 			initialProps: {
	// 				ref: targetRef,
	// 				options: initialObserverOptions,
	// 			},
	// 		}
	// 	);

	// 	expect( intersectionObserver.observers[ 0 ].options ).toEqual(
	// 		initialObserverOptions
	// 	);

	// 	const newObserverOptions = { root: container, threshold: 1 };
	// 	TestRenderer.act( () => {
	// 		rerender( { ref: targetRef, options: newObserverOptions } );
	// 	} );

	// 	expect( intersectionObserver.observers[ 0 ].options ).toEqual(
	// 		newObserverOptions
	// 	);
	// } );
} );
