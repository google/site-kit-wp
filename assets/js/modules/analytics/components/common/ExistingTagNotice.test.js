/**
 * Analytics Existing Tag Notice component tests.
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
import ExistingTagNotice from './ExistingTagNotice';
import { render } from '../../../../../../tests/js/test-utils';
import { MODULES_ANALYTICS } from '../../datastore/constants';

const setupEmptyRegistry = ( { dispatch } ) => {
	dispatch( MODULES_ANALYTICS ).receiveGetExistingTag( null );
};

describe( 'ExistingTagNotice', () => {
	it( 'should not render if does not have existing tag', async () => {
		const container = render( <ExistingTagNotice />, { setupRegistry: setupEmptyRegistry } );

		expect( container ).not.toBeNull();
	} );
} );

