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
import { createTestRegistry, provideSiteConnection, provideUserAuthentication, WithTestRegistry } from '../tests/js/utils';

const withRegistry = ( Story ) => {
	const registry = createTestRegistry();
	registry.dispatch( CORE_USER ).receiveGetTracking( { enabled: false } );

	return (
		<Story registry={ registry } />
	);
};

storiesOf( 'Setup / Using GCP', module )
	.add( 'Step one', ( args, { registry } ) => {
		global._googlesitekitLegacyData.setup.isSiteKitConnected = false;
		global._googlesitekitLegacyData.setup.isAuthenticated = false;
		global._googlesitekitLegacyData.setup.isVerified = false;
		global._googlesitekitLegacyData.setup.hasSearchConsoleProperty = false;
		global._googlesitekitLegacyData.permissions.canSetup = true;

		provideUserAuthentication( registry, {
			authenticated: false,
		} );

		return (
			<WithTestRegistry registry={ registry }>
				<SetupUsingGCP />
			</WithTestRegistry>
		);
	}, {
		decorators: [
			withRegistry,
		],
		padding: 0,
	} );

storiesOf( 'Setup / Using Proxy', module )
	.add( 'Start', ( args, { registry } ) => {
		provideSiteConnection( registry, {
			hasConnectedAdmins: false,
		} );
		return (
			<WithTestRegistry registry={ registry }>
				<SetupUsingProxy />
			</WithTestRegistry>
		);
	}, {
		decorators: [
			withRegistry,
		],
		padding: 0,
	} )
	.add( 'Start – with error', ( args, { registry } ) => {
		provideSiteConnection( registry, {
			connected: false,
			hasConnectedAdmins: false,
		} );
		return (
			<WithTestRegistry registry={ registry }>
				<SetupUsingProxy />
			</WithTestRegistry>
		);
	}, {
		decorators: [
			withRegistry,
		],
		padding: 0,
	} )
	.add( 'Start [User Input]', ( args, { registry } ) => {
		provideSiteConnection( registry, {
			hasConnectedAdmins: false,
		} );
		return (
			<WithTestRegistry
				registry={ registry }
				features={ [ 'serviceSetupV2', 'userInput' ] }
			>
				<SetupUsingProxy />
			</WithTestRegistry>
		);
	}, {
		decorators: [
			withRegistry,
		],
		padding: 0,
	} )
	.add( 'Start – with error [User Input]', ( args, { registry } ) => {
		provideSiteConnection( registry, {
			connected: false,
			hasConnectedAdmins: false,
		} );
		return (
			<WithTestRegistry
				registry={ registry }
				features={ [ 'serviceSetupV2', 'userInput' ] }
			>
				<SetupUsingProxy />
			</WithTestRegistry>
		);
	}, {
		decorators: [
			withRegistry,
		],
		padding: 0,
	} )
	.add( 'Disconnected - URL Mismatch', ( args, { registry } ) => {
		provideSiteConnection( registry, {
			hasConnectedAdmins: false,
		} );
		provideUserAuthentication( registry, {
			authenticated: false,
			disconnectedReason: DISCONNECTED_REASON_CONNECTED_URL_MISMATCH,
		} );
		return (
			<WithTestRegistry registry={ registry }>
				<SetupUsingProxy />
			</WithTestRegistry>
		);
	}, {
		decorators: [
			withRegistry,
		],
		padding: 0,
	} )
	.add( 'Disconnected - URL Mismatch [User Input]', ( args, { registry } ) => {
		provideSiteConnection( registry, {
			hasConnectedAdmins: false,
		} );
		provideUserAuthentication( registry, {
			authenticated: false,
			disconnectedReason: DISCONNECTED_REASON_CONNECTED_URL_MISMATCH,
		} );
		return (
			<WithTestRegistry
				registry={ registry }
				features={ [ 'serviceSetupV2', 'userInput' ] }
			>
				<SetupUsingProxy />
			</WithTestRegistry>
		);
	}, {
		decorators: [
			withRegistry,
		],
		padding: 0,
	} )
;
