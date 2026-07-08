/**
 * `withIntersectionObserver` HOC.
 *
 * Site Kit by Google, Copyright 2024 Google LLC
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
import { ComponentType, Ref } from 'react';

/**
 * WordPress dependencies
 */
import { useCallback, useEffect, useRef, useState } from '@wordpress/element';

interface WithIntersectionObserverProps {
	/** Called the first time the wrapped component is in view. */
	onInView?: () => void;
}

/**
 * Higher-Order Component that tells a wrapped component when it is in view.
 *
 * Observes the wrapped component's element with an `IntersectionObserver`. The
 * first time at least 45% of the element is visible, it calls `onInView`, sets
 * the `hasBeenInView` prop to `true`, and disconnects the observer, so it
 * observes only until that first time.
 *
 * @since 1.125.0
 * @since n.e.x.t Replaces the `react-use` `useIntersection` hook, which kept observing after the first time in view. Adds the `hasBeenInView` prop and makes `onInView` optional.
 *
 * @param WrappedComponent Component to wrap. It must attach the ref it receives to the element to observe.
 * @return The component that observes its element and renders the wrapped component.
 */
export default function withIntersectionObserver< P extends object >(
	WrappedComponent: ComponentType< P >
) {
	// Besides its own props, the wrapped component receives the ref of the
	// element to observe and the `hasBeenInView` prop.
	const ObservedComponent = WrappedComponent as ComponentType<
		P & { ref: Ref< Element >; hasBeenInView: boolean }
	>;

	function WithIntersectionObserverComponent( {
		onInView,
		...props
	}: P & WithIntersectionObserverProps ) {
		const [ hasBeenInView, setHasBeenInView ] = useState( false );
		const hasBeenInViewRef = useRef( false );
		const observerRef = useRef< IntersectionObserver | null >( null );
		const onInViewRef = useRef( onInView );

		useEffect( () => {
			onInViewRef.current = onInView;
		}, [ onInView ] );

		useEffect( () => {
			return () => {
				observerRef.current?.disconnect();
				observerRef.current = null;
			};
		}, [] );

		// `observeElement` is a callback ref, so React calls it each time
		// the wrapped component attaches or detaches the observed element.
		// The element can appear on a later render, for example once the
		// component's data loads, and a ref object read once inside an
		// effect with empty dependencies would miss it.
		const observeElement = useCallback( ( element: Element | null ) => {
			observerRef.current?.disconnect();
			observerRef.current = null;

			if (
				! element ||
				hasBeenInViewRef.current ||
				typeof global.IntersectionObserver !== 'function'
			) {
				return;
			}

			const observer = new global.IntersectionObserver(
				( entries ) => {
					if ( ! entries.some( ( entry ) => entry.isIntersecting ) ) {
						return;
					}

					// The wrapped component needs this only once, so disconnect
					// the observer.
					observer.disconnect();
					observerRef.current = null;
					hasBeenInViewRef.current = true;

					onInViewRef.current?.();
					setHasBeenInView( true );
				},
				{ threshold: 0.45 }
			);

			observer.observe( element );
			observerRef.current = observer;
		}, [] );

		return (
			<ObservedComponent
				ref={ observeElement }
				{ ...( props as P ) }
				hasBeenInView={ hasBeenInView }
			/>
		);
	}

	WithIntersectionObserverComponent.displayName =
		'WithIntersectionObserverComponent';
	if ( WrappedComponent.displayName || WrappedComponent.name ) {
		WithIntersectionObserverComponent.displayName += `(${
			WrappedComponent.displayName || WrappedComponent.name
		})`;
	}

	return WithIntersectionObserverComponent;
}
