/**
 * `useCombinedRefs` hook.
 *
 * Site Kit by Google, Copyright 2020 Google LLC
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
import { useEffect, useRef } from '@wordpress/element';

/**
 * Merges forwarded refs and refs within a component so that they can be used in functional components.
 *
 * Ideally we should be able to write the following:
 *
 * ```
 *	const Component = React.forwardRef( ( props, ref ) => {
 *  	const innerRef = React.useRef( ref ); // set ref as an initial value
 * } );
 * ```
 * but this is not the case. The ref from outside stays { current: undefined }.
 * To fix that we need to write some manual update function for the ref
 * and merge those refs to use the single reference value.
 *
 * @since n.e.x.t
 *
 * @see https://itnext.io/reusing-the-ref-from-forwardref-with-react-hooks-4ce9df693dd
 *
 * @param {...Object} refs Object from useRef or createRef functions.
 * @return {Object} Merged refs object.
 */
export function useCombinedRefs( ...refs ) {
	const targetRef = useRef();

	useEffect( () => {
		refs.forEach( ( reference ) => {
			if ( ! reference ) {
				return;
			}

			if ( typeof reference === 'function' ) {
				reference( targetRef.current );
			} else {
				reference.current = targetRef.current;
			}
		} );
	}, refs );

	return targetRef;
}
