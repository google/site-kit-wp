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
import { useIntersection } from 'react-use';
import PropTypes from 'prop-types';

/**
 * WordPress dependencies
 */
import { useEffect, useRef, useState } from '@wordpress/element';

/**
 * Higher-Order Component to render a wrapped component and trigger a callback when it becomes in view.
 *
 * This was initially added to provide a workaround for a limitation with the `useIntersection` hook from `react-use`.
 * We should replace `useIntersection()` with a version that doesn't have this limitation.
 * See https://github.com/streamich/react-use/issues/2359.
 *
 * This HOC can however remain as an abstraction around `useIntersection()` to avoid repeating the same logic.
 *
 * @since 1.125.0
 *
 * @param {WPComponent} WrappedComponent Component to wrap.
 * @return {Function} Enhancing function.
 */
export default function withIntersectionObserver( WrappedComponent ) {
	function WithIntersectionObserverComponent( { onInView, ...props } ) {
		const inViewRef = useRef();
		const intersectionEntry = useIntersection( inViewRef, {
			root: null,
			threshold: 0.45,
		} );
		const [ hasBeenInView, setHasBeenInView ] = useState( false );
		const inView =
			!! intersectionEntry?.isIntersecting &&
			!! intersectionEntry?.intersectionRatio;

		useEffect( () => {
			if ( ! intersectionEntry ) {
				return;
			}

			if ( inView && ! hasBeenInView ) {
				onInView();
				setHasBeenInView( true );
			}
		}, [ hasBeenInView, inView, intersectionEntry, onInView ] );

		return <WrappedComponent ref={ inViewRef } { ...props } />;
	}

	WithIntersectionObserverComponent.displayName =
		'WithIntersectionObserverComponent';
	if ( WrappedComponent.displayName || WrappedComponent.name ) {
		WithIntersectionObserverComponent.displayName += `(${
			WrappedComponent.displayName || WrappedComponent.name
		})`;
	}
	WithIntersectionObserverComponent.propTypes = {
		onInView: PropTypes.func.isRequired,
		...WrappedComponent.propTypes,
	};

	return WithIntersectionObserverComponent;
}
