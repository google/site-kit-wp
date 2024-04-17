/**
 * AdSense AdBlocker Warning component tests.
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
import AdBlockerWarning from './AdBlockerWarning';
import { render } from '../../../../../../tests/js/test-utils';
import { MODULES_ADSENSE } from '../../datastore/constants';
import { CORE_USER } from '../../../../googlesitekit/datastore/user/constants';
import { provideModules } from '../../../../../../tests/js/utils';

const setupAdBlockerNotConnectedRegistry = ( registry ) => {
	provideModules( registry, [
		{
			slug: 'adsense',
			active: true,
			connected: false,
		},
	] );
	registry.dispatch( MODULES_ADSENSE ).receiveGetSettings( {} );
	registry.dispatch( CORE_USER ).receiveIsAdBlockerActive( true );
};

const setupAdBlockerConnectedRegistry = ( registry ) => {
	provideModules( registry, [
		{
			slug: 'adsense',
			active: true,
			connected: true,
		},
	] );
	registry.dispatch( MODULES_ADSENSE ).receiveGetSettings( {} );
	registry.dispatch( CORE_USER ).receiveIsAdBlockerActive( true );
};

const setupNoAdBlockerRegistry = ( registry ) => {
	registry.dispatch( MODULES_ADSENSE ).receiveGetSettings( {} );
	registry.dispatch( CORE_USER ).receiveIsAdBlockerActive( false );
};

describe( 'AdBlockerWarning', () => {
	it( 'should render the warning when an AdBlocker is active and module is not connected', () => {
		const { container } = render( <AdBlockerWarning />, {
			setupRegistry: setupAdBlockerNotConnectedRegistry,
		} );

		expect(
			container.querySelector( '.googlesitekit-settings-module-warning' )
		).not.toEqual( null );

		expect( container.textContent ).toContain( 'to set up AdSense' );
	} );

	it( 'should render the warning when an AdBlocker is active and module is connected', () => {
		const { container } = render( <AdBlockerWarning />, {
			setupRegistry: setupAdBlockerConnectedRegistry,
		} );

		expect(
			container.querySelector( '.googlesitekit-settings-module-warning' )
		).not.toEqual( null );

		expect( container.textContent ).toContain( 'latest AdSense data' );
	} );

	it( 'should render nothing when no AdBlocker is active', () => {
		const { container } = render( <AdBlockerWarning />, {
			setupRegistry: setupNoAdBlockerRegistry,
		} );

		expect( container.firstChild ).toEqual( null );
	} );
} );
