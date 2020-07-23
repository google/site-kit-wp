/**
 * AdSense AdBlocker Warning component tests.
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
 * Internal dependencies
 */
import AdBlockerWarning from './AdBlockerWarning';
import { render } from '../../../../../../tests/js/test-utils';
import { STORE_NAME } from '../../datastore/constants';

const setupAdBlockerRegistry = ( registry ) => {
	registry.dispatch( STORE_NAME ).receiveGetSettings( {} );
	registry.dispatch( STORE_NAME ).receiveIsAdBlockerActive( true );
};

const setupNoAdBlockerRegistry = ( registry ) => {
	registry.dispatch( STORE_NAME ).receiveGetSettings( {} );
	registry.dispatch( STORE_NAME ).receiveIsAdBlockerActive( false );
};

describe( 'AdBlockerWarning', () => {
	it( 'should render the warning when an AdBlocker is active', async () => {
		const { container } = render( <AdBlockerWarning />, { setupRegistry: setupAdBlockerRegistry } );

		expect( container.querySelector( '.googlesitekit-settings-module-warning' ) ).not.toEqual( null );
	} );

	it( 'should render nothing when no AdBlocker is active', async () => {
		const { container } = render( <AdBlockerWarning />, { setupRegistry: setupNoAdBlockerRegistry } );

		expect( container.firstChild ).toEqual( null );
	} );
} );
