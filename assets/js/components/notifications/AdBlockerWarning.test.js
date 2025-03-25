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
import { render } from '../../../../tests/js/test-utils';
import { MODULES_ADSENSE } from '../../modules/adsense/datastore/constants';
import { CORE_USER } from '../../googlesitekit/datastore/user/constants';
import {
	provideModules,
	provideModuleRegistrations,
	createTestRegistry,
} from '../../../../tests/js/utils';

describe( 'AdBlockerWarning', () => {
	let registry;

	beforeEach( () => {
		registry = createTestRegistry();

		provideModules( registry, [
			{
				slug: 'adsense',
				active: true,
				connected: true,
			},
		] );
		provideModuleRegistrations( registry );
	} );

	it( 'should render the warning when an AdBlocker is active and module is not connected', () => {
		provideModules( registry, [
			{
				slug: 'adsense',
				active: true,
				connected: false,
			},
		] );

		registry.dispatch( MODULES_ADSENSE ).receiveGetSettings( {} );
		registry.dispatch( CORE_USER ).receiveIsAdBlockerActive( true );
		const { container } = render(
			<AdBlockerWarning moduleSlug="adsense" />,
			{
				registry,
			}
		);

		expect(
			container.querySelector( '.googlesitekit-warning-notice' )
		).not.toEqual( null );

		expect( container.textContent ).toContain( 'To set up AdSense' );
	} );

	it( 'should render the warning when an AdBlocker is active and module is connected', () => {
		registry.dispatch( MODULES_ADSENSE ).receiveGetSettings( {} );
		registry.dispatch( CORE_USER ).receiveIsAdBlockerActive( true );

		const { container } = render(
			<AdBlockerWarning moduleSlug="adsense" />,
			{
				registry,
			}
		);

		expect(
			container.querySelector( '.googlesitekit-warning-notice' )
		).not.toEqual( null );

		expect( container.textContent ).toContain( 'latest AdSense data' );
	} );

	it( 'should render nothing when no AdBlocker is active', () => {
		registry.dispatch( MODULES_ADSENSE ).receiveGetSettings( {} );
		registry.dispatch( CORE_USER ).receiveIsAdBlockerActive( false );

		const { container } = render(
			<AdBlockerWarning moduleSlug="adsense" />,
			{
				registry,
			}
		);

		expect( container.firstChild ).toEqual( null );
	} );
} );
