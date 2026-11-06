/**
 * Admin pointer initialization.
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
import registerPointerTracking from './registerPointerTracking';
import type { AdminPointer } from './types';

/**
 * Opens a WordPress pointer and registers its tracking.
 *
 * @since n.e.x.t
 *
 * @param  $       The jQuery instance with the `wp-pointer` plugin loaded.
 * @param  ajaxURL The WordPress admin AJAX URL, used to persist dismissal.
 * @param  pointer The pointer data.
 * @return {void}
 */
export default function initializePointer(
	$: typeof jQuery,
	ajaxURL: string,
	pointer: AdminPointer
) {
	const { slug, targetID, title, content, position, tracking } = pointer;

	const target = $( `#${ targetID }` );
	if ( ! target.length ) {
		return;
	}

	let trackingHandlers: ReturnType< typeof registerPointerTracking > | null =
		null;

	target
		.pointer( {
			content: `<h3>${ title }</h3>${ content }`,
			position,
			pointerWidth: 420,
			pointerClass: pointer.class,
			close() {
				$.post( ajaxURL, {
					action: 'dismiss-wp-pointer',
					pointer: slug,
				} );
				trackingHandlers?.onDismiss?.();
			},
			buttons(
				_event: unknown,
				container: { pointer: typeof jQuery; element: typeof jQuery }
			) {
				container.pointer.on(
					'click',
					'[data-action="dismiss"]',
					() => {
						container.element.pointer( 'close' );
					}
				);
			},
		} )
		.pointer( 'open' );

	if ( tracking ) {
		trackingHandlers = registerPointerTracking( slug, tracking );
	}
}
