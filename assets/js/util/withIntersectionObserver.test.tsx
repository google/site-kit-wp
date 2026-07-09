/**
 * `withIntersectionObserver` HOC tests.
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
import { intersectionObserver } from '@shopify/jest-dom-mocks';
import { FC } from 'react';

/**
 * WordPress dependencies
 */
import { forwardRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { act, render } from '@tests/js/test-utils';
import withIntersectionObserver from './withIntersectionObserver';

interface TestComponentProps {
	/** Set by `withIntersectionObserver` once this component is in view. */
	hasBeenInView?: boolean;
}

const TestComponent: FC< TestComponentProps > = forwardRef<
	HTMLDivElement,
	TestComponentProps
>( ( { hasBeenInView, children }, ref ) => (
	<div ref={ ref }>
		{ children }
		{ hasBeenInView ? 'Has been in view' : 'Not yet in view' }
	</div>
) );
TestComponent.displayName = 'TestComponent';

const TestComponentWithIntersectionObserver =
	withIntersectionObserver( TestComponent );

/**
 * Builds an `IntersectionObserver` entry for the target, in the shape the
 * `intersectionObserver` mock passes to the callback.
 *
 * @since n.e.x.t
 *
 * @param target         Element the observer watches.
 * @param isIntersecting Whether the target is in view. Sets the intersection ratio to `0.5` when `true`, `0` when `false`.
 * @return An `IntersectionObserverEntry`-shaped object for the mock.
 */
function buildIntersectionEntry( target: Element, isIntersecting: boolean ) {
	return {
		boundingClientRect: target.getBoundingClientRect(),
		intersectionRatio: isIntersecting ? 0.5 : 0,
		intersectionRect: target.getBoundingClientRect(),
		isIntersecting,
		rootBounds: target.getBoundingClientRect(),
		target,
		time: 300,
	};
}

describe( 'withIntersectionObserver', () => {
	beforeEach( () => {
		intersectionObserver.mock();
	} );

	afterEach( () => {
		intersectionObserver.restore();
	} );

	it( 'renders the wrapped component with its own props', () => {
		const { getByText } = render(
			<TestComponentWithIntersectionObserver onInView={ () => {} }>
				Wrapped content
			</TestComponentWithIntersectionObserver>
		);

		expect( getByText( /Wrapped content/ ) ).toBeInTheDocument();
	} );

	it( 'observes the wrapped component element with the default 0.45 threshold', () => {
		const { container } = render(
			<TestComponentWithIntersectionObserver onInView={ () => {} } />
		);

		expect( intersectionObserver.observers ).toHaveLength( 1 );
		expect( intersectionObserver.observers[ 0 ].target ).toBe(
			container.firstChild
		);
		expect( intersectionObserver.observers[ 0 ].options ).toEqual( {
			threshold: 0.45,
		} );
	} );

	it( 'observes with a custom threshold when the caller gives one', () => {
		const TestComponentWithCustomThreshold = withIntersectionObserver(
			TestComponent,
			{ threshold: 0.9 }
		);

		render( <TestComponentWithCustomThreshold onInView={ () => {} } /> );

		expect( intersectionObserver.observers[ 0 ].options ).toEqual( {
			threshold: 0.9,
		} );
	} );

	it( 'calls onInView once and stops observing when the element is in view', () => {
		const onInView = jest.fn();

		render(
			<TestComponentWithIntersectionObserver onInView={ onInView } />
		);
		const { target } = intersectionObserver.observers[ 0 ];

		act( () => {
			intersectionObserver.simulate(
				buildIntersectionEntry( target, true )
			);
		} );

		expect( onInView ).toHaveBeenCalledTimes( 1 );
		expect( intersectionObserver.observers ).toHaveLength( 0 );
	} );

	it( 'does not call onInView while the element is out of view', () => {
		const onInView = jest.fn();

		render(
			<TestComponentWithIntersectionObserver onInView={ onInView } />
		);
		const { target } = intersectionObserver.observers[ 0 ];

		act( () => {
			intersectionObserver.simulate(
				buildIntersectionEntry( target, false )
			);
		} );

		expect( onInView ).not.toHaveBeenCalled();
		expect( intersectionObserver.observers ).toHaveLength( 1 );
	} );

	it( 'sets hasBeenInView on the wrapped component once it is in view', () => {
		const { getByText } = render(
			<TestComponentWithIntersectionObserver onInView={ () => {} } />
		);
		const { target } = intersectionObserver.observers[ 0 ];

		expect( getByText( /Not yet in view/ ) ).toBeInTheDocument();

		act( () => {
			intersectionObserver.simulate(
				buildIntersectionEntry( target, true )
			);
		} );

		expect( getByText( /Has been in view/ ) ).toBeInTheDocument();
	} );

	it( 'sets hasBeenInView even when the caller gives no onInView callback', () => {
		// The widget framework renders a wrapped widget with no `onInView`
		// prop, so the wrapped component must still get `hasBeenInView`.
		const { getByText } = render(
			<TestComponentWithIntersectionObserver />
		);
		const { target } = intersectionObserver.observers[ 0 ];

		act( () => {
			intersectionObserver.simulate(
				buildIntersectionEntry( target, true )
			);
		} );

		expect( getByText( /Has been in view/ ) ).toBeInTheDocument();
	} );

	it( 'stops observing when it unmounts before the element is in view', () => {
		const { unmount } = render(
			<TestComponentWithIntersectionObserver onInView={ () => {} } />
		);

		expect( intersectionObserver.observers ).toHaveLength( 1 );

		unmount();
		expect( intersectionObserver.observers ).toHaveLength( 0 );
	} );

	it( 'renders without observing when the browser has no IntersectionObserver', () => {
		delete ( global as { IntersectionObserver?: unknown } )
			.IntersectionObserver;

		const { getByText } = render(
			<TestComponentWithIntersectionObserver onInView={ () => {} } />
		);

		expect( getByText( /Not yet in view/ ) ).toBeInTheDocument();
		expect( intersectionObserver.observers ).toHaveLength( 0 );
	} );

	it( 'names the wrapped component in its displayName', () => {
		expect( TestComponentWithIntersectionObserver.displayName ).toBe(
			'WithIntersectionObserverComponent(TestComponent)'
		);
	} );
} );
