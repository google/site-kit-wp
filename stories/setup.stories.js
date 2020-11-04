/**
 * Setup Stories.
 *
 * Site Kit by Google, Copyright 2020 Google LLC
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
import Setup from '../assets/js/components/setup';
import SetupUsingProxy from '../assets/js/components/setup/setup-proxy';
import { STORE_NAME as CORE_SITE } from '../assets/js/googlesitekit/datastore/site/constants';
import { STORE_NAME as CORE_USER, DISCONNECTED_REASON_CONNECTED_URL_MISMATCH } from '../assets/js/googlesitekit/datastore/user/constants';
import { WithTestRegistry } from '../tests/js/utils';

storiesOf( 'Setup', module )
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
			<WithTestRegistry callback={ setupRegistry }>
				<Setup />
			</WithTestRegistry>
		);
	} );

storiesOf( 'Setup / Using Proxy', module )
	.add( 'Disconnected - URL Mismatch', () => {
		// Set the featureFlag.
		global.featureFlags = { userInput: { enabled: true } };
		global._googlesitekitLegacyData.setup.isSiteKitConnected = true;

		const setupRegistry = ( { dispatch } ) => {
			dispatch( CORE_SITE ).receiveGetConnection( {} );
			dispatch( CORE_USER ).receiveGetAuthentication( {
				authenticated: false,
				requiredScopes: [],
				grantedScopes: [],
				disconnectedReason: DISCONNECTED_REASON_CONNECTED_URL_MISMATCH,
			} );
		};

		return (
			<WithTestRegistry callback={ setupRegistry }>
				<SetupUsingProxy />
			</WithTestRegistry>
		);
	} );
