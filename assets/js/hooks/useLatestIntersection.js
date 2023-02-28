/**
 * `useLatestIntersection` hook.
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
 * WordPress dependencies
 */
import { useEffect, useState } from '@wordpress/element';

/**
 * Returns latest intersaction observer entry for a given element.
 *
 * This hook is based on the `useIntersection` hook from the `react-use` package. The difference
 * is that this hook returns the last intersection observer entry instead of the first one.
 * See https://github.com/streamich/react-use/blob/325f5bd69904346788ea981ec18bfc7397c611df/src/useIntersection.ts.
 *
 * @since 1.95.0
 *
 * @param {Object} ref     A ref object that points to the HTML element to observe.
 * @param {Object} options Options for the Intersection Observer.
 * @return {IntersectionObserverEntry | null} The latest Intersection Observer entry.
 */
const useLatestIntersection = ( ref, options ) => {
	const [ intersectionObserverEntry, setIntersectionObserverEntry ] =
		useState( null );

	useEffect( () => {
		if (
			ref.current &&
			typeof global.IntersectionObserver === 'function'
		) {
			const handler = ( entries ) => {
				setIntersectionObserverEntry( entries[ entries.length - 1 ] );
			};

			const observer = new global.IntersectionObserver(
				handler,
				options
			);
			observer.observe( ref.current );

			return () => {
				setIntersectionObserverEntry( null );
				observer.disconnect();
			};
		}
		return () => {};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [ ref.current, options.threshold, options.root, options.rootMargin ] );

	return intersectionObserverEntry;
};

export default useLatestIntersection;
