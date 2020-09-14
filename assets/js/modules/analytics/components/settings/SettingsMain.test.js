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
import { render, fireEvent, waitFor } from '../../../../../../tests/js/test-utils';
import { STORE_NAME } from '../../datastore/constants';
import { STORE_NAME as CORE_SITE } from '../../../../googlesitekit/datastore/site/constants';
import { STORE_NAME as CORE_MODULES, SETTINGS_DISPLAY_MODES } from '../../../../googlesitekit/modules/datastore/constants';
import * as fixtures from '../../datastore/__fixtures__';
import SettingsMain from './SettingsMain';

describe( 'SettingsMain', () => {
	const initialSettings = {
		accountID: fixtures.accountsPropertiesProfiles.profiles[ 0 ].accountId,
		propertyID: fixtures.accountsPropertiesProfiles.profiles[ 0 ].webPropertyId,
		internalWebPropertyID: fixtures.accountsPropertiesProfiles.profiles[ 0 ].internalWebPropertyId,
		profileID: fixtures.accountsPropertiesProfiles.profiles[ 0 ].id,
		useSnippet: true,
		trackingDisabled: [],
		anonymizeIP: true,
	};

	const coreModules = [
		{
			slug: 'analytics',
			name: 'Analytics',
			description: 'Get a deeper understanding of your customers. Google Analytics gives you the free tools you need to analyze data for your business in one place.',
			homepage: 'https://analytics.google.com/analytics/web',
			internal: false,
			active: true,
			forceActive: false,
			connected: true,
			dependencies: [],
			dependants: [ 'optimize', 'tagmanager' ],
			order: 10,
		},
	];

	it( 'rolls back settings if settings have changed and is not editing', async () => {
		fetchMock.get( /accounts-properties-profiles/, { body: fixtures.accountsPropertiesProfiles, status: 200 } );
		fetchMock.get( /modules\/data\/list/, { body: coreModules, status: 200 } );

		const setupRegistry = ( { dispatch } ) => {
			dispatch( CORE_SITE ).receiveSiteInfo( {} );
			dispatch( CORE_MODULES ).setSettingsDisplayMode( 'analytics', SETTINGS_DISPLAY_MODES.VIEW );
			dispatch( STORE_NAME ).receiveGetExistingTag( null );
			dispatch( STORE_NAME ).receiveGetSettings( initialSettings );
		};

		const { registry, container } = render( <SettingsMain slug="analytics" />, { setupRegistry } );
		const { select } = registry;

		expect( select( STORE_NAME ).getSettings() ).toEqual( initialSettings );

		act( () => {
			registry.dispatch( CORE_MODULES ).setSettingsDisplayMode( 'analytics', SETTINGS_DISPLAY_MODES.EDIT );
		} );

		await waitFor( () => container.querySelector( '.googlesitekit-analytics-usesnippet' ) );
		fireEvent.click( container.querySelector( '.googlesitekit-analytics-usesnippet [role="switch"]' ) );
		expect( select( STORE_NAME ).haveSettingsChanged() ).toBe( true );

		act( () => {
			registry.dispatch( CORE_MODULES ).setSettingsDisplayMode( 'analytics', SETTINGS_DISPLAY_MODES.VIEW );
		} );

		expect( select( STORE_NAME ).getSettings() ).toEqual( initialSettings );
	} );
} );
