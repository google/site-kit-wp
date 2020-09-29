/**
 * Analytics SettingsMain tests.
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
import { act } from 'react-dom/test-utils';

/**
 * Internal dependencies
 */
import {
	render,
	fireEvent,
	waitFor,
	createTestRegistry,
	unsubscribeFromAll,
} from '../../../../../../tests/js/test-utils';
import { STORE_NAME } from '../../datastore/constants';
import { STORE_NAME as CORE_SITE } from '../../../../googlesitekit/datastore/site/constants';
import { STORE_NAME as CORE_MODULES } from '../../../../googlesitekit/modules/datastore/constants';
import * as fixtures from '../../datastore/__fixtures__';
import SettingsMain from './SettingsMain';
import defaultModules from '../../../../googlesitekit/modules/datastore/fixtures.json';
import { untilResolved } from '../../../../../../tests/js/utils';

describe( 'SettingsMain', () => {
	let registry;
	beforeEach( () => {
		registry = createTestRegistry();
		// Receive empty modules to prevent unexpected fetch by resolver.
		registry.dispatch( CORE_MODULES ).receiveGetModules( defaultModules );
	} );

	afterEach( () => {
		unsubscribeFromAll( registry );
	} );

	const initialSettings = {
		accountID: fixtures.accountsPropertiesProfiles.profiles[ 0 ].accountId, // eslint-disable-line sitekit/camelcase-acronyms
		propertyID: fixtures.accountsPropertiesProfiles.profiles[ 0 ].webPropertyId, // eslint-disable-line sitekit/camelcase-acronyms
		internalWebPropertyID: fixtures.accountsPropertiesProfiles.profiles[ 0 ].internalWebPropertyId, // eslint-disable-line sitekit/camelcase-acronyms
		profileID: fixtures.accountsPropertiesProfiles.profiles[ 0 ].id,
		useSnippet: true,
		trackingDisabled: [],
		anonymizeIP: true,
	};

	it( 'rolls back settings if settings have changed and is not editing', async () => {
		fetchMock.get( /accounts-properties-profiles/, { body: fixtures.accountsPropertiesProfiles, status: 200 } );

		registry.dispatch( CORE_SITE ).receiveSiteInfo( {} );
		registry.dispatch( STORE_NAME ).receiveGetExistingTag( null );
		registry.dispatch( STORE_NAME ).receiveGetSettings( initialSettings );
		registry.dispatch( CORE_MODULES ).setSettingsViewCurrentModule( 'analytics' );

		const { container } = render( <SettingsMain />, { registry } );

		expect( registry.select( STORE_NAME ).getSettings() ).toEqual( initialSettings );

		act( () => {
			registry.dispatch( CORE_MODULES ).setSettingsViewIsEditing( true );
		} );

		await waitFor( () => container.querySelector( '.googlesitekit-analytics-usesnippet' ) );
		fireEvent.click( container.querySelector( '.googlesitekit-analytics-usesnippet [role="switch"]' ) );
		expect( registry.select( STORE_NAME ).haveSettingsChanged() ).toBe( true );

		act( () => {
			registry.dispatch( CORE_MODULES ).setSettingsViewIsEditing( false );
		} );

		expect( registry.select( STORE_NAME ).getSettings() ).toEqual( initialSettings );
	} );

	it( 'does not roll back settings if settings have changed and is editing', async () => {
		fetchMock.get(
			/accounts-properties-profiles/,
			{ body: fixtures.accountsPropertiesProfiles, status: 200 }
		);

		const useSnippet = ! initialSettings.useSnippet;
		registry.dispatch( CORE_SITE ).receiveSiteInfo( {} );
		registry.dispatch( STORE_NAME ).receiveGetExistingTag( null );
		registry.dispatch( STORE_NAME ).receiveGetSettings( initialSettings );
		registry.dispatch( STORE_NAME ).setUseSnippet( useSnippet );
		registry.dispatch( CORE_MODULES ).setSettingsViewCurrentModule( 'analytics' );
		registry.dispatch( CORE_MODULES ).setSettingsViewIsEditing( true );

		render( <SettingsMain />, { registry } );

		await waitFor( () => untilResolved( registry, STORE_NAME ).getAccounts() );

		expect( registry.select( STORE_NAME ).getSettings() ).toEqual( { ...initialSettings, useSnippet } );
	} );
} );
