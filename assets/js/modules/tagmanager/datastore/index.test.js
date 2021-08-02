/**
 * Tag Manager datastore tests.
 *
 * Site Kit by Google, Copyright 2021 Google LLC
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
import { MODULES_TAGMANAGER } from './constants';
import { createTestRegistry } from '../../../../../tests/js/utils';

describe( 'modules/tagmanager', () => {
	describe( 'renamed actions', () => {
		it( 'renames setAmpContainerID to setAMPContainerID', () => {
			const { dispatch } = createTestRegistry();
			const actions = dispatch( MODULES_TAGMANAGER );

			expect( actions.setAMPContainerID ).toBeInstanceOf( Function );
			// eslint-disable-next-line sitekit/acronym-case
			expect( actions.setAmpContainerID ).not.toBeInstanceOf( Function );
		} );
	} );

	describe( 'renamed selectors', () => {
		it( 'renames getAmpContainerID to getAMPContainerID', () => {
			const { select } = createTestRegistry();
			const selectors = select( MODULES_TAGMANAGER );

			expect( selectors.getAMPContainerID ).toBeInstanceOf( Function );
			// eslint-disable-next-line sitekit/acronym-case
			expect( selectors.getAmpContainerID ).not.toBeInstanceOf(
				Function
			);
		} );
	} );
} );
