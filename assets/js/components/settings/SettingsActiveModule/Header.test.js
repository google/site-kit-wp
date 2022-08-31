/**
 * SettingsActiveModule Header component tests.
 *
 * Site Kit by Google, Copyright 2022 Google LLC
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
import Header from '.';
import {
	render,
	createTestRegistry,
	provideModules,
} from '../../../../../tests/js/test-utils';

describe( 'Header', () => {
	let registry;

	beforeEach( () => {
		registry = createTestRegistry();

		provideModules( registry, [
			{
				slug: 'analytics',
				active: true,
				connected: true,
			},
			{
				slug: 'pagespeed-insights',
				active: true,
				connected: true,
			},
			{
				slug: 'tagmanager',
				active: true,
				// Intentionally not connected here with both settings components for tests below.
				connected: false,
			},
		] );
	} );

	it( 'should render "Connected" for a connected module', () => {
		const { container } = render( <Header slug="analytics" />, {
			registry,
		} );

		expect( container ).toHaveTextContent( 'Connected' );
	} );

	it( 'should render a button to complete setup for a non-connected module', () => {
		const { queryByRole } = render( <Header slug="tagmanager" />, {
			registry,
		} );

		const button = queryByRole( 'button' );
		expect( button ).toBeInTheDocument();
		expect( button ).toHaveTextContent( 'Complete setup for Tag Manager' );
	} );
} );
