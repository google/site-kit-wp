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
import { render } from '../../../../../../tests/js/test-utils';
import {
	createTestRegistry,
	provideSiteInfo,
	provideUserCapabilities,
} from '../../../../../../tests/js/utils';
import { CORE_USER } from '../../../../googlesitekit/datastore/user/constants';
import { MODULES_SIGN_IN_WITH_GOOGLE } from '../../datastore/constants';
import SettingsNotice from './SettingsNotice';

describe( 'SettingsNotice', () => {
	let registry;

	beforeEach( () => {
		registry = createTestRegistry();

		provideUserCapabilities( registry );
		provideSiteInfo( registry, { anyoneCanRegister: false } );

		registry.dispatch( CORE_USER ).receiveGetDismissedItems( [] );

		registry.dispatch( MODULES_SIGN_IN_WITH_GOOGLE ).receiveGetSettings( {
			oneTapEnabled: false,
			oneTapOnAllPages: false,
		} );

		registry.dispatch( MODULES_SIGN_IN_WITH_GOOGLE ).receiveModuleData( {
			isWooCommerceActive: false,
			isWooCommerceRegistrationEnabled: false,
		} );
	} );

	it( 'should not render anything when anyoneCanRegister is true', () => {
		provideSiteInfo( registry, { anyoneCanRegister: true } );

		const { container } = render( <SettingsNotice />, {
			registry,
		} );

		expect( container ).toBeEmptyDOMElement();
	} );

	it( 'should render AnyoneCanRegisterDisabledNotice when anyoneCanRegister is false and WooCommerce is not active', () => {
		const { container } = render( <SettingsNotice />, {
			registry,
		} );

		expect(
			container.querySelector(
				'.googlesitekit-registration-disabled-notice'
			)
		).toHaveClass( 'googlesitekit-anyone-can-register-disabled-notice' );
	} );

	it( 'should render AnyoneCanRegisterDisabledNotice when anyoneCanRegister is false, both One Tap settings are true and WooCommerce is active but isWooCommerceRegistrationEnabled is true', () => {
		registry.dispatch( MODULES_SIGN_IN_WITH_GOOGLE ).setSettings( {
			oneTapEnabled: true,
			oneTapOnAllPages: true,
		} );

		registry.dispatch( MODULES_SIGN_IN_WITH_GOOGLE ).receiveModuleData( {
			isWooCommerceActive: true,
			isWooCommerceRegistrationEnabled: true,
		} );

		const { container } = render( <SettingsNotice />, {
			registry,
		} );

		expect(
			container.querySelector(
				'.googlesitekit-registration-disabled-notice'
			)
		).toHaveClass( 'googlesitekit-anyone-can-register-disabled-notice' );
	} );

	it( 'should render AnyoneCanRegisterDisabledNotice when anyoneCanRegister is false, both One Tap settings are true, WooCommerce is active but isWooCommerceRegistrationEnabled is already true', async () => {
		registry.dispatch( MODULES_SIGN_IN_WITH_GOOGLE ).setSettings( {
			oneTapEnabled: true,
			oneTapOnAllPages: true,
		} );

		await registry
			.dispatch( MODULES_SIGN_IN_WITH_GOOGLE )
			.receiveModuleData( {
				isWooCommerceActive: true,
				isWooCommerceRegistrationEnabled: true,
			} );

		const { container } = render( <SettingsNotice />, {
			registry,
		} );

		expect(
			container.querySelector(
				'.googlesitekit-registration-disabled-notice'
			)
		).toHaveClass( 'googlesitekit-anyone-can-register-disabled-notice' );
	} );

	it( 'should render RegistrationDisabledNotice when anyoneCanRegister is false, both One Tap settings are true and WooCommerce is not active', () => {
		registry.dispatch( MODULES_SIGN_IN_WITH_GOOGLE ).setSettings( {
			oneTapEnabled: true,
			oneTapOnAllPages: true,
		} );

		const { container } = render( <SettingsNotice />, {
			registry,
		} );

		expect(
			container.querySelector(
				'.googlesitekit-registration-disabled-notice'
			)
		).not.toHaveClass(
			'googlesitekit-anyone-can-register-disabled-notice'
		);
	} );

	it( 'should render RegistrationDisabledNotice when anyoneCanRegister is false, both One Tap settings are true, WooCommerce is active and isWooCommerceRegistrationEnabled is false', async () => {
		registry.dispatch( MODULES_SIGN_IN_WITH_GOOGLE ).setSettings( {
			oneTapEnabled: true,
			oneTapOnAllPages: true,
		} );

		await registry
			.dispatch( MODULES_SIGN_IN_WITH_GOOGLE )
			.receiveModuleData( {
				isWooCommerceActive: true,
				isWooCommerceRegistrationEnabled: false,
			} );

		const { container } = render( <SettingsNotice />, {
			registry,
		} );

		expect(
			container.querySelector(
				'.googlesitekit-registration-disabled-notice'
			)
		).not.toHaveClass(
			'googlesitekit-anyone-can-register-disabled-notice'
		);
	} );
} );
