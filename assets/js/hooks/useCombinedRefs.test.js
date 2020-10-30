/**
 * `useCombinedRefs` hook tests.
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
import { createRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { renderHook } from '../../../tests/js/test-utils';
import { useCombinedRefs } from './useCombinedRefs';

describe( 'useCombinedRefs', () => {
	it( 'should return unchanged ref if only one ref is passed as parameter', () => {
		const ref = createRef();

		const { result } = renderHook( () => useCombinedRefs( ref ) );

		expect( result.current ).toStrictEqual( { current: undefined } );
	} );

	it( 'should merge 2 references to be a single one', () => {
		const ref = {
			current: 'el',
		};
		const ref2 = createRef();

		const { result } = renderHook( () => useCombinedRefs( ref, ref2 ) );

		expect( result.current ).toStrictEqual( { current: 'el' } );
	} );
} );
