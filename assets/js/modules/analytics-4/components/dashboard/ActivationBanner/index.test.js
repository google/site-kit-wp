/**
 * ActivationBanner component tests.
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
import {
	createTestRegistry,
	render,
	provideModules,
	unsubscribeFromAll,
} from '../../../../../../../tests/js/test-utils';
import ActivationBanner from './index';

describe( 'ActivationBanner', () => {
	let registry;

	beforeEach( () => {
		registry = createTestRegistry();

		fetchMock.getOnce(
			new RegExp( '^/google-site-kit/v1/core/user/data/authentication' ),
			{
				authenticated: true,
			}
		);

		fetchMock.getOnce(
			new RegExp(
				'^/google-site-kit/v1/modules/analytics/data/settings'
			),
			{ body: {}, status: 200 }
		);
	} );

	afterEach( () => {
		unsubscribeFromAll( registry );
	} );

	it( 'does not render when UA is not connected', async () => {
		provideModules( registry, [
			{
				slug: 'analytics-4',
				active: true,
				connected: false,
			},
		] );

		const { container, waitForRegistry } = render( <ActivationBanner />, {
			registry,
		} );
		await waitForRegistry();
		expect( container.childElementCount ).toBe( 0 );
	} );

	it( 'does not render when UA and GA4 are both connected', async () => {
		provideModules( registry, [
			{
				slug: 'analytics-4',
				active: true,
				connected: true,
			},
		] );

		const { container, waitForRegistry } = render( <ActivationBanner />, {
			registry,
		} );
		await waitForRegistry();
		expect( container.childElementCount ).toBe( 0 );
	} );

	it( 'does render when UA is connected but GA4 is not connected', async () => {
		provideModules( registry, [
			{
				slug: 'analytics-4',
				active: true,
				connected: false,
			},
		] );

		const { container, waitForRegistry } = render( <ActivationBanner />, {
			registry,
		} );
		await waitForRegistry();
		expect( container.childElementCount ).toBe( 1 );
	} );
} );
