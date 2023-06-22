/**
 * AdBlockingRecoveryNotification component tests.
 *
 * Site Kit by Google, Copyright 2023 Google LLC
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
import AdBlockingRecoveryNotification from './AdBlockingRecoveryNotification';
import {
	createTestRegistry,
	provideModules,
	provideSiteInfo,
	render,
} from '../../../../tests/js/test-utils';
import {
	MODULES_ADSENSE,
	ENUM_AD_BLOCKING_RECOVERY_SETUP_STATUS,
	AD_BLOCKING_RECOVERY_SETUP_SUCCESS_NOTIFICATION_ID,
} from '../../modules/adsense/datastore/constants';
import { CORE_USER } from '../../googlesitekit/datastore/user/constants';

describe( 'AdBlockingRecoveryNotification', () => {
	let registry;

	beforeEach( () => {
		registry = createTestRegistry();
		provideSiteInfo( registry );
		provideModules( registry, [
			{
				slug: 'adsense',
				active: true,
				connected: true,
			},
		] );

		registry.dispatch( MODULES_ADSENSE ).setSettings( {
			accountID: 'pub-123456',
		} );
	} );

	it( 'should not render notification if ad blocking recovery setup status is not "setup-confirmed"', () => {
		registry.dispatch( CORE_USER ).receiveGetDismissedItems( [] );

		registry
			.dispatch( MODULES_ADSENSE )
			.setAdBlockingRecoverySetupStatus(
				ENUM_AD_BLOCKING_RECOVERY_SETUP_STATUS.TAG_PLACED
			);

		const { container } = render( <AdBlockingRecoveryNotification />, {
			registry,
		} );

		expect( container ).toBeEmptyDOMElement();
	} );

	it( 'should not render notification if it is already dismissed', () => {
		registry
			.dispatch( MODULES_ADSENSE )
			.setAdBlockingRecoverySetupStatus(
				ENUM_AD_BLOCKING_RECOVERY_SETUP_STATUS.SETUP_CONFIRMED
			);

		registry
			.dispatch( CORE_USER )
			.receiveGetDismissedItems( [
				AD_BLOCKING_RECOVERY_SETUP_SUCCESS_NOTIFICATION_ID,
			] );

		const { container } = render( <AdBlockingRecoveryNotification />, {
			registry,
		} );

		expect( container ).toBeEmptyDOMElement();
	} );

	it( 'should render notification otherwise', () => {
		registry
			.dispatch( MODULES_ADSENSE )
			.setAdBlockingRecoverySetupStatus(
				ENUM_AD_BLOCKING_RECOVERY_SETUP_STATUS.SETUP_CONFIRMED
			);

		registry.dispatch( CORE_USER ).receiveGetDismissedItems( [] );

		const { container } = render( <AdBlockingRecoveryNotification />, {
			registry,
		} );

		expect( container.childElementCount ).toBe( 1 );
	} );
} );
