/**
 * AnyoneCanRegisterReadOnly tests.
 *
 * Site Kit by Google, Copyright 2026 Google LLC
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
import { PERMISSION_MANAGE_OPTIONS } from '@/js/googlesitekit/datastore/user/constants';
import { render } from '@tests/js/test-utils';
import {
	createTestRegistry,
	provideSiteInfo,
	provideUserCapabilities,
} from '@tests/js/utils';
import AnyoneCanRegisterReadOnly from './AnyoneCanRegisterReadOnly';

describe( 'AnyoneCanRegisterReadOnly', () => {
	let registry;

	beforeEach( () => {
		registry = createTestRegistry();

		provideUserCapabilities( registry );
	} );

	it( 'shows the WordPress registration message when anyoneCanRegister is true', () => {
		provideSiteInfo( registry, {
			anyoneCanRegister: true,
			anyoneCanRegisterWooCommerce: false,
		} );

		const { container } = render( <AnyoneCanRegisterReadOnly />, {
			registry,
		} );

		expect( container.textContent ).toContain(
			'Visit WordPress settings to manage this membership setting.'
		);
	} );

	it( 'does not link to WordPress settings when the user cannot manage options on multisite', () => {
		provideUserCapabilities( registry, {
			[ PERMISSION_MANAGE_OPTIONS ]: false,
		} );
		provideSiteInfo( registry, {
			anyoneCanRegister: true,
			isMultisite: true,
		} );

		const { queryByRole } = render( <AnyoneCanRegisterReadOnly />, {
			registry,
		} );

		expect(
			queryByRole( 'link', { name: 'WordPress settings' } )
		).not.toBeInTheDocument();
	} );

	it( 'shows the WooCommerce registration message when anyoneCanRegister is false but WooCommerce registration is open', () => {
		provideSiteInfo( registry, {
			anyoneCanRegister: false,
			anyoneCanRegisterWooCommerce: true,
			adminURL: 'http://example.com/wp-admin',
		} );

		const { container, getByRole } = render(
			<AnyoneCanRegisterReadOnly />,
			{
				registry,
			}
		);

		expect( container.textContent ).toContain(
			'Visit WooCommerce settings to manage this membership setting.'
		);

		expect(
			getByRole( 'link', { name: 'WooCommerce settings' } )
		).toHaveAttribute(
			'href',
			'http://example.com/wp-admin/admin.php?page=wc-settings&tab=account'
		);
	} );

	it( 'does not link to WooCommerce settings when the user cannot manage options', () => {
		provideUserCapabilities( registry, {
			[ PERMISSION_MANAGE_OPTIONS ]: false,
		} );
		provideSiteInfo( registry, {
			anyoneCanRegister: false,
			anyoneCanRegisterWooCommerce: true,
		} );

		const { queryByRole } = render( <AnyoneCanRegisterReadOnly />, {
			registry,
		} );

		expect(
			queryByRole( 'link', { name: 'WooCommerce settings' } )
		).not.toBeInTheDocument();
	} );

	it( 'shows the disabled message when neither WordPress nor WooCommerce registration is open', () => {
		provideSiteInfo( registry, {
			anyoneCanRegister: false,
			anyoneCanRegisterWooCommerce: false,
		} );

		const { container } = render( <AnyoneCanRegisterReadOnly />, {
			registry,
		} );

		expect( container.textContent ).toContain(
			'Only existing users can use Sign in with Google to access their accounts.'
		);
	} );
} );
