/**
 * `useScrollToID` hook.
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
 * WordPress dependencies
 */
import { useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { useBreakpoint } from '@/js/hooks/useBreakpoint';
import useQueryArg from '@/js/hooks/useQueryArg';
import { getNavigationalScrollTop } from '@/js/util/scroll';

/**
 * Custom hook to scroll to a specific HTML ID when the `scrollTo` query
 * argument matches the provided ID.
 *
 * @since 1.175.0
 *
 * @param {string} id The ID to scroll to.
 */
export default function useScrollToID( id ) {
	const [ scrollTo ] = useQueryArg( 'scrollTo' );

	const breakpoint = useBreakpoint();

	useEffect( () => {
		if ( scrollTo !== id ) {
			return;
		}

		setTimeout( () => {
			global.scrollTo( {
				top: getNavigationalScrollTop( `#${ id }`, breakpoint ) - 20,
				behavior: 'smooth',
			} );
		}, 50 );
	}, [ id, scrollTo, breakpoint ] );
}
