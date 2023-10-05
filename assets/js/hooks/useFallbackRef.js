/**
 * `useFallbackRef` hook.
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
import { useRef } from '@wordpress/element';

/**
 * Creates a fallback ref if the desired ref is invalid.
 *
 * @since n.e.x.t
 *
 * @param {Object} ref          The desired ref.
 * @param {any}    initialValue The initial value of the fallback ref. Default is `null`.
 * @return {Object} The desired ref or a fallback ref.
 */
export function useFallbackRef( ref, initialValue = null ) {
	const fallbackRef = useRef( initialValue );

	return ref || fallbackRef;
}
