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

const defaultSettings = {
	accountID: '',
	clientID: '',
	accountStatus: '',
	siteStatus: '',
	useSnippet: true,
	accountSetupComplete: false,
	siteSetupComplete: false,
};

const accountCompleteSettings = {
	accountID: fixtures.accounts[ 0 ].id,
	clientID: fixtures.clients[ 0 ].id,
	accountStatus: '',
	siteStatus: '',
	useSnippet: false,
	accountSetupComplete: true,
	siteSetupComplete: false,
};

storiesOf( 'AdSense Module/Setup', module )
	.add( 'Loading', () => {
		filterAdSenseSetup();

		const setupRegistry = ( registry ) => {
			registry.dispatch( STORE_NAME ).receiveGetSettings( defaultSettings );
			registry.dispatch( STORE_NAME ).receiveIsAdBlockerActive( false );
		};

		return <Setup callback={ setupRegistry } />;
	} )
	.add( 'AdBlocker active', () => {
		filterAdSenseSetup();

		const setupRegistry = ( registry ) => {
			registry.dispatch( STORE_NAME ).receiveGetSettings( defaultSettings );
			registry.dispatch( STORE_NAME ).receiveIsAdBlockerActive( true );
			registry.dispatch( STORE_NAME ).receiveExistingTag( null );
			registry.dispatch( STORE_NAME ).receiveAccounts( fixtures.accounts );
			registry.dispatch( STORE_NAME ).receiveClients( fixtures.clients, { accountID: fixtures.accounts[ 0 ].id } );
			registry.dispatch( STORE_NAME ).receiveAlerts( [], { accountID: fixtures.accounts[ 0 ].id } );
			registry.dispatch( STORE_NAME ).receiveURLChannels( [], { clientID: fixtures.clients[ 0 ].id } );
		};

		return <Setup callback={ setupRegistry } />;
	} )
	.add( 'No account', () => {
		filterAdSenseSetup();

		const setupRegistry = ( registry ) => {
			registry.dispatch( STORE_NAME ).receiveGetSettings( defaultSettings );
			registry.dispatch( STORE_NAME ).receiveIsAdBlockerActive( false );
			registry.dispatch( STORE_NAME ).receiveExistingTag( null );
			registry.dispatch( STORE_NAME ).finishResolution( 'getAccounts', [] );
			registry.dispatch( STORE_NAME ).receiveError( {
				// Typically thrown when fetching accounts.
				message: 'No account.',
				data: {
					reason: 'noAdSenseAccount',
				},
			} );
		};

		return <Setup callback={ setupRegistry } />;
	} )
	.add( 'No account (existing tag)', () => {
		filterAdSenseSetup();

		const setupRegistry = ( registry ) => {
			registry.dispatch( STORE_NAME ).receiveGetSettings( defaultSettings );
			registry.dispatch( STORE_NAME ).receiveIsAdBlockerActive( false );
			registry.dispatch( STORE_NAME ).receiveExistingTag( 'ca-pub-123456789' );
			registry.dispatch( STORE_NAME ).finishResolution( 'getAccounts', [] );
			registry.dispatch( STORE_NAME ).receiveError( {
				// Typically thrown when fetching accounts.
				message: 'No account.',
				data: {
					reason: 'noAdSenseAccount',
				},
			} );
		};

		return <Setup callback={ setupRegistry } />;
	} )
	.add( 'Multiple accounts', () => {
		filterAdSenseSetup();

		const setupRegistry = ( registry ) => {
			registry.dispatch( STORE_NAME ).receiveGetSettings( defaultSettings );
			registry.dispatch( STORE_NAME ).receiveIsAdBlockerActive( false );
			registry.dispatch( STORE_NAME ).receiveExistingTag( null );
			registry.dispatch( STORE_NAME ).receiveAccounts( fixtures.accountsMultiple );
			registry.dispatch( STORE_NAME ).receiveClients( fixtures.clients, { accountID: fixtures.accountsMultiple[ 0 ].id } );
			registry.dispatch( STORE_NAME ).receiveClients( [ {
				...fixtures.clients[ 0 ],
				id: `ca-${ fixtures.accountsMultiple[ 1 ].id }`,
			} ], { accountID: fixtures.accountsMultiple[ 1 ].id } );
			registry.dispatch( STORE_NAME ).receiveAlerts( [], { accountID: fixtures.accountsMultiple[ 0 ].id } );
			registry.dispatch( STORE_NAME ).receiveAlerts( [], { accountID: fixtures.accountsMultiple[ 1 ].id } );
			registry.dispatch( STORE_NAME ).receiveURLChannels( [], { clientID: fixtures.clients[ 0 ].id } );
			registry.dispatch( STORE_NAME ).receiveURLChannels( [], { clientID: `ca-${ fixtures.accountsMultiple[ 1 ].id }` } );
		};

		return <Setup callback={ setupRegistry } />;
	} )
	.add( 'Disapproved account', () => {
		filterAdSenseSetup();

		const setupRegistry = ( registry ) => {
			registry.dispatch( STORE_NAME ).receiveGetSettings( defaultSettings );
			registry.dispatch( STORE_NAME ).receiveIsAdBlockerActive( false );
			registry.dispatch( STORE_NAME ).receiveExistingTag( null );
			registry.dispatch( STORE_NAME ).finishResolution( 'getAccounts', [] );
			registry.dispatch( STORE_NAME ).receiveError( {
				// Typically thrown when fetching accounts.
				message: 'Disapproved account.',
				data: {
					reason: 'disapprovedAccount',
				},
			} );
		};

		return <Setup callback={ setupRegistry } />;
	} )
	.add( 'Graylisted account', () => {
		filterAdSenseSetup();

		const setupRegistry = ( registry ) => {
			registry.dispatch( STORE_NAME ).receiveGetSettings( defaultSettings );
			registry.dispatch( STORE_NAME ).receiveIsAdBlockerActive( false );
			registry.dispatch( STORE_NAME ).receiveExistingTag( null );
			registry.dispatch( STORE_NAME ).receiveAccounts( fixtures.accounts );
			registry.dispatch( STORE_NAME ).receiveClients( fixtures.clients, { accountID: fixtures.accounts[ 0 ].id } );
			registry.dispatch( STORE_NAME ).receiveAlerts( fixtures.alertsGraylisted, { accountID: fixtures.accounts[ 0 ].id } );
			registry.dispatch( STORE_NAME ).receiveURLChannels( [], { clientID: fixtures.clients[ 0 ].id } );
		};

		return <Setup callback={ setupRegistry } />;
	} )
	.add( 'Pending account', () => {
		filterAdSenseSetup();

		const setupRegistry = ( registry ) => {
			registry.dispatch( STORE_NAME ).receiveGetSettings( defaultSettings );
			registry.dispatch( STORE_NAME ).receiveIsAdBlockerActive( false );
			registry.dispatch( STORE_NAME ).receiveExistingTag( null );
			registry.dispatch( STORE_NAME ).receiveAccounts( fixtures.accounts );
			registry.dispatch( STORE_NAME ).receiveClients( fixtures.clients, { accountID: fixtures.accounts[ 0 ].id } );
			registry.dispatch( STORE_NAME ).finishResolution( 'getAlerts', [ fixtures.accounts[ 0 ].id ] );
			registry.dispatch( STORE_NAME ).receiveError( {
				// Typically thrown when fetching alerts.
				message: 'Account pending review.',
				data: {
					reason: 'accountPendingReview',
				},
			} );
			registry.dispatch( STORE_NAME ).receiveURLChannels( [], { clientID: fixtures.clients[ 0 ].id } );
		};

		return <Setup callback={ setupRegistry } />;
	} )
	.add( 'Account without AFC client (AdMob)', () => {
		filterAdSenseSetup();

		const setupRegistry = ( registry ) => {
			registry.dispatch( STORE_NAME ).receiveGetSettings( defaultSettings );
			registry.dispatch( STORE_NAME ).receiveIsAdBlockerActive( false );
			registry.dispatch( STORE_NAME ).receiveExistingTag( null );
			registry.dispatch( STORE_NAME ).receiveAccounts( fixtures.accounts );
			registry.dispatch( STORE_NAME ).receiveClients( fixtures.clientsNoAFC, { accountID: fixtures.accounts[ 0 ].id } );
			registry.dispatch( STORE_NAME ).receiveAlerts( fixtures.alerts, { accountID: fixtures.accounts[ 0 ].id } );
		};

		return <Setup callback={ setupRegistry } />;
	} )
	.add( 'Newly approved account', () => {
		filterAdSenseSetup();

		const setupRegistry = ( registry ) => {
			registry.dispatch( STORE_NAME ).receiveGetSettings( {
				...defaultSettings,
				// Previous status needs to be something other than
				// '' or 'approved'.
				accountStatus: 'pending',
			} );
			registry.dispatch( STORE_NAME ).receiveIsAdBlockerActive( false );
			registry.dispatch( STORE_NAME ).receiveExistingTag( null );
			registry.dispatch( STORE_NAME ).receiveAccounts( fixtures.accounts );
			registry.dispatch( STORE_NAME ).receiveClients( fixtures.clients, { accountID: fixtures.accounts[ 0 ].id } );
			registry.dispatch( STORE_NAME ).receiveAlerts( fixtures.alerts, { accountID: fixtures.accounts[ 0 ].id } );
			registry.dispatch( STORE_NAME ).receiveURLChannels( [], { clientID: fixtures.clients[ 0 ].id } );
		};

		return <Setup callback={ setupRegistry } />;
	} )
	.add( 'Newly approved account (existing tag with permission)', () => {
		filterAdSenseSetup();

		const setupRegistry = ( registry ) => {
			registry.dispatch( STORE_NAME ).receiveGetSettings( {
				...defaultSettings,
				// Previous status needs to be something other than
				// '' or 'approved'.
				accountStatus: 'pending',
			} );
			registry.dispatch( STORE_NAME ).receiveIsAdBlockerActive( false );
			registry.dispatch( STORE_NAME ).receiveExistingTag( fixtures.clients[ 0 ].id );
			registry.dispatch( STORE_NAME ).receiveTagPermission( {
				accountID: fixtures.accounts[ 0 ].id,
				clientID: fixtures.clients[ 0 ].id,
				permission: true,
			} );
			registry.dispatch( STORE_NAME ).receiveAccounts( fixtures.accounts );
			registry.dispatch( STORE_NAME ).receiveClients( fixtures.clients, { accountID: fixtures.accounts[ 0 ].id } );
			registry.dispatch( STORE_NAME ).receiveAlerts( fixtures.alerts, { accountID: fixtures.accounts[ 0 ].id } );
			registry.dispatch( STORE_NAME ).receiveURLChannels( [], { clientID: fixtures.clients[ 0 ].id } );
		};

		return <Setup callback={ setupRegistry } />;
	} )
	.add( 'Newly approved account (existing tag without permission)', () => {
		filterAdSenseSetup();

		const setupRegistry = ( registry ) => {
			registry.dispatch( STORE_NAME ).receiveGetSettings( {
				...defaultSettings,
				// Previous status needs to be something other than
				// '' or 'approved'.
				accountStatus: 'pending',
			} );
			registry.dispatch( STORE_NAME ).receiveIsAdBlockerActive( false );
			registry.dispatch( STORE_NAME ).receiveExistingTag( 'ca-pub-123456789' );
			registry.dispatch( STORE_NAME ).receiveTagPermission( {
				accountID: 'pub-123456789',
				clientID: 'ca-pub-123456789',
				permission: false,
			} );
			registry.dispatch( STORE_NAME ).receiveAccounts( fixtures.accounts );
			registry.dispatch( STORE_NAME ).receiveClients( fixtures.clients, { accountID: fixtures.accounts[ 0 ].id } );
			registry.dispatch( STORE_NAME ).receiveAlerts( fixtures.alerts, { accountID: fixtures.accounts[ 0 ].id } );
			registry.dispatch( STORE_NAME ).receiveURLChannels( [], { clientID: fixtures.clients[ 0 ].id } );
		};

		return <Setup callback={ setupRegistry } />;
	} )
	.add( 'Already approved account', () => {
		filterAdSenseSetup();

		const setupRegistry = ( registry ) => {
			registry.dispatch( STORE_NAME ).receiveGetSettings( defaultSettings );
			registry.dispatch( STORE_NAME ).receiveIsAdBlockerActive( false );
			registry.dispatch( STORE_NAME ).receiveExistingTag( null );
			registry.dispatch( STORE_NAME ).receiveAccounts( fixtures.accounts );
			registry.dispatch( STORE_NAME ).receiveClients( fixtures.clients, { accountID: fixtures.accounts[ 0 ].id } );
			registry.dispatch( STORE_NAME ).receiveAlerts( fixtures.alerts, { accountID: fixtures.accounts[ 0 ].id } );
			registry.dispatch( STORE_NAME ).receiveURLChannels( [], { clientID: fixtures.clients[ 0 ].id } );
		};

		return <Setup callback={ setupRegistry } />;
	} )
	.add( 'Already approved account (existing tag with permission)', () => {
		filterAdSenseSetup();

		const setupRegistry = ( registry ) => {
			registry.dispatch( STORE_NAME ).receiveGetSettings( defaultSettings );
			registry.dispatch( STORE_NAME ).receiveIsAdBlockerActive( false );
			registry.dispatch( STORE_NAME ).receiveExistingTag( fixtures.clients[ 0 ].id );
			registry.dispatch( STORE_NAME ).receiveTagPermission( {
				accountID: fixtures.accounts[ 0 ].id,
				clientID: fixtures.clients[ 0 ].id,
				permission: true,
			} );
			registry.dispatch( STORE_NAME ).receiveAccounts( fixtures.accounts );
			registry.dispatch( STORE_NAME ).receiveClients( fixtures.clients, { accountID: fixtures.accounts[ 0 ].id } );
			registry.dispatch( STORE_NAME ).receiveAlerts( fixtures.alerts, { accountID: fixtures.accounts[ 0 ].id } );
			registry.dispatch( STORE_NAME ).receiveURLChannels( [], { clientID: fixtures.clients[ 0 ].id } );
		};

		return <Setup callback={ setupRegistry } />;
	} )
	.add( 'Already approved account (existing tag without permission)', () => {
		filterAdSenseSetup();

		const setupRegistry = ( registry ) => {
			registry.dispatch( STORE_NAME ).receiveGetSettings( defaultSettings );
			registry.dispatch( STORE_NAME ).receiveIsAdBlockerActive( false );
			registry.dispatch( STORE_NAME ).receiveExistingTag( 'ca-pub-123456789' );
			registry.dispatch( STORE_NAME ).receiveTagPermission( {
				accountID: 'pub-123456789',
				clientID: 'ca-pub-123456789',
				permission: false,
			} );
			registry.dispatch( STORE_NAME ).receiveAccounts( fixtures.accounts );
			registry.dispatch( STORE_NAME ).receiveClients( fixtures.clients, { accountID: fixtures.accounts[ 0 ].id } );
			registry.dispatch( STORE_NAME ).receiveAlerts( fixtures.alerts, { accountID: fixtures.accounts[ 0 ].id } );
			registry.dispatch( STORE_NAME ).receiveURLChannels( [], { clientID: fixtures.clients[ 0 ].id } );
		};

		return <Setup callback={ setupRegistry } />;
	} )
	.add( 'Site not added', () => {
		filterAdSenseSetup();

		const setupRegistry = ( registry ) => {
			registry.dispatch( STORE_NAME ).receiveGetSettings( accountCompleteSettings );
			registry.dispatch( STORE_NAME ).receiveIsAdBlockerActive( false );
			registry.dispatch( STORE_NAME ).receiveExistingTag( null );
			registry.dispatch( STORE_NAME ).receiveAccounts( fixtures.accounts );
			registry.dispatch( STORE_NAME ).receiveClients( fixtures.clients, { accountID: fixtures.accounts[ 0 ].id } );
			registry.dispatch( STORE_NAME ).receiveAlerts( fixtures.alerts, { accountID: fixtures.accounts[ 0 ].id } );
			registry.dispatch( STORE_NAME ).receiveURLChannels( [], { clientID: fixtures.clients[ 0 ].id } );
		};

		return <Setup callback={ setupRegistry } />;
	} )
	.add( 'Site added', () => {
		filterAdSenseSetup();

		const setupRegistry = ( registry ) => {
			registry.dispatch( STORE_NAME ).receiveGetSettings( accountCompleteSettings );
			registry.dispatch( STORE_NAME ).receiveIsAdBlockerActive( false );
			registry.dispatch( STORE_NAME ).receiveExistingTag( null );
			registry.dispatch( STORE_NAME ).receiveAccounts( fixtures.accounts );
			registry.dispatch( STORE_NAME ).receiveClients( fixtures.clients, { accountID: fixtures.accounts[ 0 ].id } );
			registry.dispatch( STORE_NAME ).receiveAlerts( fixtures.alerts, { accountID: fixtures.accounts[ 0 ].id } );
			registry.dispatch( STORE_NAME ).receiveURLChannels( fixtures.urlchannels, { clientID: fixtures.clients[ 0 ].id } );
		};

		return <Setup callback={ setupRegistry } />;
	} )
;
