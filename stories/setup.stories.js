/**
 * Setup Stories.
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
 * External dependencies
 */
import { storiesOf } from '@storybook/react';

/**
 * Internal dependencies
 */
import SetupUsingGCP from '../assets/js/components/legacy-setup/SetupUsingGCP';
import SetupUsingProxy from '../assets/js/components/setup/SetupUsingProxy';
import { CORE_USER, DISCONNECTED_REASON_CONNECTED_URL_MISMATCH } from '../assets/js/googlesitekit/datastore/user/constants';
import { provideUserAuthentication, WithTestRegistry } from '../tests/js/utils';

storiesOf( 'Setup / Using GCP', module )
	.add( 'Step one', () => {
		global._googlesitekitLegacyData.setup.isSiteKitConnected = false;
		global._googlesitekitLegacyData.setup.isAuthenticated = false;
		global._googlesitekitLegacyData.setup.isVerified = false;
		global._googlesitekitLegacyData.setup.hasSearchConsoleProperty = false;
		global._googlesitekitLegacyData.permissions.canSetup = true;

		const setupRegistry = ( { dispatch } ) => {
			dispatch( CORE_USER ).receiveGetAuthentication( {
				authenticated: false,
				requiredScopes: [],
				grantedScopes: [],
			} );
		};

		return (
			<WithTestRegistry callback={ setupRegistry } features={ [ 'storeErrorNotifications' ] }>
				<SetupUsingGCP />
			</WithTestRegistry>
		);
	} );

storiesOf( 'Setup / Using Proxy', module )
	.add( 'Start', () => {
		return (
			<WithTestRegistry>
				<SetupUsingProxy />
			</WithTestRegistry>
		);
	} )
	.add( 'Start – with error', () => {
		global._googlesitekitLegacyData.setup.isSiteKitConnected = false;
		return (
			<WithTestRegistry>
				<SetupUsingProxy />
			</WithTestRegistry>
		);
	} )
	.add( 'Start [User Input]', () => {
		return (
			<WithTestRegistry features={ [ 'serviceSetupV2', 'userInput' ] }>
				<SetupUsingProxy />
			</WithTestRegistry>
		);
	} )
	.add( 'Start – with error [User Input]', () => {
		global._googlesitekitLegacyData.setup.isSiteKitConnected = false;

		return (
			<WithTestRegistry features={ [ 'serviceSetupV2', 'userInput' ] }>
				<SetupUsingProxy />
			</WithTestRegistry>
		);
	} )
	.add( 'Disconnected - URL Mismatch', () => {
		const setupRegistry = ( registry ) => {
			provideUserAuthentication( registry, {
				authenticated: false,
				disconnectedReason: DISCONNECTED_REASON_CONNECTED_URL_MISMATCH,
			} );
		};
		return (
			<WithTestRegistry callback={ setupRegistry }>
				<SetupUsingProxy />
			</WithTestRegistry>
		);
	} )
	.add( 'Disconnected - URL Mismatch [User Input]', () => {
		const setupRegistry = ( registry ) => {
			provideUserAuthentication( registry, {
				authenticated: false,
				disconnectedReason: DISCONNECTED_REASON_CONNECTED_URL_MISMATCH,
			} );
		};
		return (
			<WithTestRegistry
				callback={ setupRegistry }
				features={ [ 'serviceSetupV2', 'userInput' ] }
			>
				<SetupUsingProxy />
			</WithTestRegistry>
		);
	} )
;
