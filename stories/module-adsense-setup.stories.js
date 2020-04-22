/**
 * AdSense Setup stories.
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
 * WordPress dependencies
 */
import { removeAllFilters, addFilter } from '@wordpress/hooks';

/**
 * Internal dependencies
 */
import SetupWrapper from '../assets/js/components/setup/setup-wrapper';
import { SetupMain as AdSenseSetup } from '../assets/js/modules/adsense/setup/index';
import { fillFilterWithComponent } from '../assets/js/util';
import * as fixtures from '../assets/js/modules/adsense/datastore/__fixtures__';

import { STORE_NAME } from '../assets/js/modules/adsense/datastore';
import { WithTestRegistry } from '../tests/js/utils';

function filterAdSenseSetup() {
	global.googlesitekit.setup.moduleToSetup = 'adsense';

	removeAllFilters( 'googlesitekit.ModuleSetup-adsense' );
	addFilter(
		'googlesitekit.ModuleSetup-adsense',
		'googlesitekit.AdSenseModuleSetup',
		fillFilterWithComponent( AdSenseSetup )
	);
}

function Setup( props ) {
	return (
		<WithTestRegistry { ...props }>
			<SetupWrapper />
		</WithTestRegistry>
	);
}

const emptySettings = {
	accountID: '',
	clientID: '',
	accountStatus: '',
	siteStatus: '',
	useSnippet: false,
	accountSetupComplete: false,
	siteSetupComplete: false,
};

storiesOf( 'AdSense Module/Setup', module )
	.add( 'Loading', () => {
		filterAdSenseSetup();

		const setupRegistry = ( registry ) => {
			registry.dispatch( STORE_NAME ).setSettings( emptySettings );
			registry.dispatch( STORE_NAME ).receiveAccounts( [] );
			registry.dispatch( STORE_NAME ).receiveClients( [] );
			registry.dispatch( STORE_NAME ).receiveAlerts( [], { accountID: fixtures.accounts[ 0 ].id } );
			registry.dispatch( STORE_NAME ).receiveURLChannels( [], { clientID: fixtures.clients[ 0 ].id } );
			registry.dispatch( STORE_NAME ).receiveExistingTag( null );
			registry.dispatch( STORE_NAME ).receiveIsAdBlockerActive( false );
			registry.stores[ STORE_NAME ].store.dispatch( { type: 'FETCH_ACCOUNTS' } );
		};

		return <Setup callback={ setupRegistry } />;
	} )
	.add( 'AdBlocker active', () => {
		filterAdSenseSetup();

		const setupRegistry = ( registry ) => {
			registry.dispatch( STORE_NAME ).setSettings( emptySettings );
			registry.dispatch( STORE_NAME ).receiveAccounts( fixtures.accounts );
			registry.dispatch( STORE_NAME ).receiveClients( fixtures.clients );
			registry.dispatch( STORE_NAME ).receiveAlerts( [], { accountID: fixtures.accounts[ 0 ].id } );
			registry.dispatch( STORE_NAME ).receiveURLChannels( [], { clientID: fixtures.clients[ 0 ].id } );
			registry.dispatch( STORE_NAME ).receiveExistingTag( null );
			registry.dispatch( STORE_NAME ).receiveIsAdBlockerActive( true );
			registry.stores[ STORE_NAME ].store.dispatch( { type: 'FETCH_ACCOUNTS' } );
		};

		return <Setup callback={ setupRegistry } />;
	} )
	.add( 'default (temporary)', () => {
		filterAdSenseSetup();

		const setupRegistry = ( registry ) => {
			registry.dispatch( STORE_NAME ).setSettings( emptySettings );
			registry.dispatch( STORE_NAME ).receiveAccounts( fixtures.accounts );
			registry.dispatch( STORE_NAME ).receiveClients( fixtures.clients );
			registry.dispatch( STORE_NAME ).receiveAlerts( [], { accountID: fixtures.accounts[ 0 ].id } );
			registry.dispatch( STORE_NAME ).receiveURLChannels( [], { clientID: fixtures.clients[ 0 ].id } );
			registry.dispatch( STORE_NAME ).receiveExistingTag( null );
			registry.dispatch( STORE_NAME ).receiveIsAdBlockerActive( false );
			registry.stores[ STORE_NAME ].store.dispatch( { type: 'FETCH_ACCOUNTS' } );
		};

		return <Setup callback={ setupRegistry } />;
	} )
;
