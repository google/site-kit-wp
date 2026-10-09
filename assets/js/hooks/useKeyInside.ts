/**
 * `useKeyInside` hook.
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
import type { RefObject } from 'react';

/**
 * WordPress dependencies
 */
import { useEffect } from '@wordpress/element';

/**
 * Listens for matching keys on a ref's element, allowing handlers to stop propagation.
 *
 * @since n.e.x.t
 *
 * @param  key     KeyboardEvent.key value to respond to.
 * @param  ref     React ref to the element containing the event target.
 * @param  handler Callback receiving the native keyboard event.
 * @return {void}
 */
export function useKeyInside(
	key: string,
	// eslint-disable-next-line sitekit/acronym-case -- Native DOM type.
	ref: RefObject< HTMLElement | null >,
	handler: ( event: KeyboardEvent ) => void
): void {
	useEffect( () => {
		const container = ref.current;

		function onKeyDown( event: KeyboardEvent ) {
			if ( event.key === key ) {
				handler( event );
			}
		}

		container?.addEventListener( 'keydown', onKeyDown );

		return () => {
			container?.removeEventListener( 'keydown', onKeyDown );
		};
	}, [ key, ref, handler ] );
}
