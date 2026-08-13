/**
 * SettingsNotice tests.
 *
 * Site Kit by Google, Copyright 2025 Google LLC
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
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import { MODULES_SIGN_IN_WITH_GOOGLE } from '@/js/modules/sign-in-with-google/datastore/constants';
import { render } from '@tests/js/test-utils';
import {
	createTestRegistry,
	provideSiteInfo,
	provideUserCapabilities,
} from '@tests/js/utils';
import SettingsNotice from './SettingsNotice';

describe( 'SettingsNotice', () => {
	let registry;

	beforeEach( () => {
		registry = createTestRegistry();

		provideUserCapabilities( registry );
		provideSiteInfo( registry, {
			anyoneCanRegister: false,
			anyoneCanRegisterWooCommerce: false,
		} );

		registry.dispatch( CORE_USER ).receiveGetDismissedItems( [] );

		registry.dispatch( MODULES_SIGN_IN_WITH_GOOGLE ).receiveGetSettings( {
			oneTapEnabled: false,
		} );
	} );

	it( 'should not render anything when anyoneCanRegister is true', () => {
		provideSiteInfo( registry, { anyoneCanRegister: true } );

		const { container } = render( <SettingsNotice />, {
			registry,
		} );

		expect( container ).toBeEmptyDOMElement();
	} );

	it( 'should not render anything when anyoneCanRegister is false but anyoneCanRegisterWooCommerce is true', () => {
		provideSiteInfo( registry, {
			anyoneCanRegister: false,
			anyoneCanRegisterWooCommerce: true,
		} );

		registry.dispatch( MODULES_SIGN_IN_WITH_GOOGLE ).setSettings( {
			oneTapEnabled: true,
		} );

		const { container } = render( <SettingsNotice />, {
			registry,
		} );

		expect( container ).toBeEmptyDOMElement();
	} );

	it( 'should render AnyoneCanRegisterDisabledNotice when anyoneCanRegister is false and WooCommerce registration is closed', () => {
		const { container } = render( <SettingsNotice />, {
			registry,
		} );

		expect(
			container.querySelector( '.googlesitekit-notice--info' ).textContent
		).toContain( 'to allow your visitors to create an account' );
	} );

	it( 'should render RegistrationDisabledNotice when anyoneCanRegister is false, One Tap is enabled and WooCommerce registration is closed', () => {
		registry.dispatch( MODULES_SIGN_IN_WITH_GOOGLE ).setSettings( {
			oneTapEnabled: true,
		} );

		const { container } = render( <SettingsNotice />, {
			registry,
		} );

		expect(
			container.querySelector( '.googlesitekit-notice--warning' )
				.textContent
		).toContain( 'Using “One Tap sign in” will cause' );
	} );
} );
