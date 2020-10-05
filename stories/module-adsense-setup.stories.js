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
 * Internal dependencies
 */
import SetupWrapper from '../assets/js/components/setup/setup-wrapper';
import { SetupMain as AdSenseSetup } from '../assets/js/modules/adsense/components/setup/index';
import * as fixtures from '../assets/js/modules/adsense/datastore/__fixtures__';

import { STORE_NAME } from '../assets/js/modules/adsense/datastore';
import { STORE_NAME as CORE_MODULES } from '../assets/js/googlesitekit/modules/datastore/constants';
import { WithTestRegistry, createTestRegistry } from '../tests/js/utils';

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
	.addDecorator( ( storyFn ) => {
		global._googlesitekitLegacyData.setup.moduleToSetup = 'adsense';
		const registry = createTestRegistry();
		registry.dispatch( CORE_MODULES ).receiveGetModules( [
			{
				slug: 'adsense',
				active: true,
				connected: true,
			},
		] );
		registry.dispatch( CORE_MODULES ).registerModule( 'adsense', {
			setupComponent: AdSenseSetup,
		} );

		return storyFn( registry );
	} )
	.add( 'Loading', ( registry ) => {
		registry.dispatch( STORE_NAME ).receiveGetSettings( defaultSettings );
		registry.dispatch( STORE_NAME ).receiveIsAdBlockerActive( false );

		return <Setup registry={ registry } />;
	} )
	.add( 'AdBlocker active', ( registry ) => {
		registry.dispatch( STORE_NAME ).receiveGetSettings( defaultSettings );
		registry.dispatch( STORE_NAME ).receiveIsAdBlockerActive( true );
		registry.dispatch( STORE_NAME ).receiveGetExistingTag( null );
		registry.dispatch( STORE_NAME ).receiveGetAccounts( fixtures.accounts );
		registry.dispatch( STORE_NAME ).receiveGetClients( fixtures.clients, { accountID: fixtures.accounts[ 0 ].id } );
		registry.dispatch( STORE_NAME ).receiveGetAlerts( [], { accountID: fixtures.accounts[ 0 ].id } );
		registry.dispatch( STORE_NAME ).receiveGetURLChannels( [], {
			accountID: fixtures.accounts[ 0 ].id,
			clientID: fixtures.clients[ 0 ].id,
		} );

		return <Setup registry={ registry } />;
	} )
	.add( 'No account', ( registry ) => {
		registry.dispatch( STORE_NAME ).receiveGetSettings( defaultSettings );
		registry.dispatch( STORE_NAME ).receiveIsAdBlockerActive( false );
		registry.dispatch( STORE_NAME ).receiveGetExistingTag( null );
		registry.dispatch( STORE_NAME ).finishResolution( 'getAccounts', [] );
		registry.dispatch( STORE_NAME ).receiveError( {
			// Typically thrown when fetching accounts.
			message: 'No account.',
			data: {
				reason: 'noAdSenseAccount',
			},
		}, 'getAccounts' );

		return <Setup registry={ registry } />;
	} )
	.add( 'No account (existing tag)', ( registry ) => {
		registry.dispatch( STORE_NAME ).receiveGetSettings( defaultSettings );
		registry.dispatch( STORE_NAME ).receiveIsAdBlockerActive( false );
		registry.dispatch( STORE_NAME ).receiveGetExistingTag( 'ca-pub-123456789' );
		registry.dispatch( STORE_NAME ).finishResolution( 'getAccounts', [] );
		registry.dispatch( STORE_NAME ).receiveError( {
			// Typically thrown when fetching accounts.
			message: 'No account.',
			data: {
				reason: 'noAdSenseAccount',
			},
		}, 'getAccounts' );

		return <Setup registry={ registry } />;
	} )
	.add( 'Multiple accounts', ( registry ) => {
		registry.dispatch( STORE_NAME ).receiveGetSettings( defaultSettings );
		registry.dispatch( STORE_NAME ).receiveIsAdBlockerActive( false );
		registry.dispatch( STORE_NAME ).receiveGetExistingTag( null );
		registry.dispatch( STORE_NAME ).receiveGetAccounts( fixtures.accountsMultiple );
		registry.dispatch( STORE_NAME ).receiveGetClients( fixtures.clients, { accountID: fixtures.accountsMultiple[ 0 ].id } );
		registry.dispatch( STORE_NAME ).receiveGetClients( [ {
			...fixtures.clients[ 0 ],
			id: `ca-${ fixtures.accountsMultiple[ 1 ].id }`,
		} ], { accountID: fixtures.accountsMultiple[ 1 ].id } );
		registry.dispatch( STORE_NAME ).receiveGetAlerts( [], { accountID: fixtures.accountsMultiple[ 0 ].id } );
		registry.dispatch( STORE_NAME ).receiveGetAlerts( [], { accountID: fixtures.accountsMultiple[ 1 ].id } );
		registry.dispatch( STORE_NAME ).receiveGetURLChannels( [], {
			accountID: fixtures.accountsMultiple[ 0 ].id,
			clientID: fixtures.clients[ 0 ].id,
		} );
		registry.dispatch( STORE_NAME ).receiveGetURLChannels( [], {
			accountID: fixtures.accountsMultiple[ 1 ].id,
			clientID: `ca-${ fixtures.accountsMultiple[ 1 ].id }`,
		} );

		return <Setup registry={ registry } />;
	} )
	.add( 'Disapproved account', ( registry ) => {
		registry.dispatch( STORE_NAME ).receiveGetSettings( defaultSettings );
		registry.dispatch( STORE_NAME ).receiveIsAdBlockerActive( false );
		registry.dispatch( STORE_NAME ).receiveGetExistingTag( null );
		registry.dispatch( STORE_NAME ).finishResolution( 'getAccounts', [] );
		registry.dispatch( STORE_NAME ).receiveError( {
			// Typically thrown when fetching accounts.
			message: 'Disapproved account.',
			data: {
				reason: 'disapprovedAccount',
			},
		}, 'getAccounts' );

		return <Setup registry={ registry } />;
	} )
	.add( 'Graylisted account', ( registry ) => {
		registry.dispatch( STORE_NAME ).receiveGetSettings( defaultSettings );
		registry.dispatch( STORE_NAME ).receiveIsAdBlockerActive( false );
		registry.dispatch( STORE_NAME ).receiveGetExistingTag( null );
		registry.dispatch( STORE_NAME ).receiveGetAccounts( fixtures.accounts );
		registry.dispatch( STORE_NAME ).receiveGetClients( fixtures.clients, { accountID: fixtures.accounts[ 0 ].id } );
		registry.dispatch( STORE_NAME ).receiveGetAlerts( fixtures.alertsGraylisted, { accountID: fixtures.accounts[ 0 ].id } );
		registry.dispatch( STORE_NAME ).receiveGetURLChannels( [], {
			accountID: fixtures.accounts[ 0 ].id,
			clientID: fixtures.clients[ 0 ].id,
		} );

		return <Setup registry={ registry } />;
	} )
	.add( 'Pending account', ( registry ) => {
		registry.dispatch( STORE_NAME ).receiveGetSettings( defaultSettings );
		registry.dispatch( STORE_NAME ).receiveIsAdBlockerActive( false );
		registry.dispatch( STORE_NAME ).receiveGetExistingTag( null );
		registry.dispatch( STORE_NAME ).receiveGetAccounts( fixtures.accounts );
		registry.dispatch( STORE_NAME ).receiveGetClients( fixtures.clients, { accountID: fixtures.accounts[ 0 ].id } );
		registry.dispatch( STORE_NAME ).finishResolution( 'getAlerts', [ fixtures.accounts[ 0 ].id ] );
		registry.dispatch( STORE_NAME ).receiveError( {
			// Typically thrown when fetching alerts.
			message: 'Account pending review.',
			data: {
				reason: 'accountPendingReview',
			},
		}, 'getAlerts', [ fixtures.accounts[ 0 ].id ] );
		registry.dispatch( STORE_NAME ).receiveGetURLChannels( [], {
			accountID: fixtures.accounts[ 0 ].id,
			clientID: fixtures.clients[ 0 ].id,
		} );

		return <Setup registry={ registry } />;
	} )
	.add( 'Account without AFC client (AdMob)', ( registry ) => {
		registry.dispatch( STORE_NAME ).receiveGetSettings( defaultSettings );
		registry.dispatch( STORE_NAME ).receiveIsAdBlockerActive( false );
		registry.dispatch( STORE_NAME ).receiveGetExistingTag( null );
		registry.dispatch( STORE_NAME ).receiveGetAccounts( fixtures.accounts );
		registry.dispatch( STORE_NAME ).receiveGetClients( fixtures.clientsNoAFC, { accountID: fixtures.accounts[ 0 ].id } );
		registry.dispatch( STORE_NAME ).receiveGetAlerts( fixtures.alerts, { accountID: fixtures.accounts[ 0 ].id } );

		return <Setup registry={ registry } />;
	} )
	.add( 'Newly approved account', ( registry ) => {
		registry.dispatch( STORE_NAME ).receiveGetSettings( {
			...defaultSettings,
			// Previous status needs to be something other than
			// '' or 'approved'.
			accountStatus: 'pending',
		} );
		registry.dispatch( STORE_NAME ).receiveIsAdBlockerActive( false );
		registry.dispatch( STORE_NAME ).receiveGetExistingTag( null );
		registry.dispatch( STORE_NAME ).receiveGetAccounts( fixtures.accounts );
		registry.dispatch( STORE_NAME ).receiveGetClients( fixtures.clients, { accountID: fixtures.accounts[ 0 ].id } );
		registry.dispatch( STORE_NAME ).receiveGetAlerts( fixtures.alerts, { accountID: fixtures.accounts[ 0 ].id } );
		registry.dispatch( STORE_NAME ).receiveGetURLChannels( [], {
			accountID: fixtures.accounts[ 0 ].id,
			clientID: fixtures.clients[ 0 ].id,
		} );

		return <Setup registry={ registry } />;
	} )
	.add( 'Newly approved account (existing tag with permission)', ( registry ) => {
		registry.dispatch( STORE_NAME ).receiveGetSettings( {
			...defaultSettings,
			// Previous status needs to be something other than
			// '' or 'approved'.
			accountStatus: 'pending',
		} );
		registry.dispatch( STORE_NAME ).receiveIsAdBlockerActive( false );
		registry.dispatch( STORE_NAME ).receiveGetExistingTag( fixtures.clients[ 0 ].id );
		registry.dispatch( STORE_NAME ).receiveGetTagPermission( {
			accountID: fixtures.accounts[ 0 ].id,
			permission: true,
		}, { clientID: fixtures.clients[ 0 ].id } );
		registry.dispatch( STORE_NAME ).receiveGetAccounts( fixtures.accounts );
		registry.dispatch( STORE_NAME ).receiveGetClients( fixtures.clients, { accountID: fixtures.accounts[ 0 ].id } );
		registry.dispatch( STORE_NAME ).receiveGetAlerts( fixtures.alerts, { accountID: fixtures.accounts[ 0 ].id } );
		registry.dispatch( STORE_NAME ).receiveGetURLChannels( [], {
			accountID: fixtures.accounts[ 0 ].id,
			clientID: fixtures.clients[ 0 ].id,
		} );

		return <Setup registry={ registry } />;
	} )
	.add( 'Newly approved account (existing tag without permission)', ( registry ) => {
		registry.dispatch( STORE_NAME ).receiveGetSettings( {
			...defaultSettings,
			// Previous status needs to be something other than
			// '' or 'approved'.
			accountStatus: 'pending',
		} );
		registry.dispatch( STORE_NAME ).receiveIsAdBlockerActive( false );
		registry.dispatch( STORE_NAME ).receiveGetExistingTag( 'ca-pub-123456789' );
		registry.dispatch( STORE_NAME ).receiveGetTagPermission( {
			accountID: 'pub-123456789',
			permission: false,
		}, { clientID: 'ca-pub-123456789' } );
		registry.dispatch( STORE_NAME ).receiveGetAccounts( fixtures.accounts );
		registry.dispatch( STORE_NAME ).receiveGetClients( fixtures.clients, { accountID: fixtures.accounts[ 0 ].id } );
		registry.dispatch( STORE_NAME ).receiveGetAlerts( fixtures.alerts, { accountID: fixtures.accounts[ 0 ].id } );
		registry.dispatch( STORE_NAME ).receiveGetURLChannels( [], {
			accountID: fixtures.accounts[ 0 ].id,
			clientID: fixtures.clients[ 0 ].id,
		} );

		return <Setup registry={ registry } />;
	} )
	.add( 'Already approved account', ( registry ) => {
		registry.dispatch( STORE_NAME ).receiveGetSettings( defaultSettings );
		registry.dispatch( STORE_NAME ).receiveIsAdBlockerActive( false );
		registry.dispatch( STORE_NAME ).receiveGetExistingTag( null );
		registry.dispatch( STORE_NAME ).receiveGetAccounts( fixtures.accounts );
		registry.dispatch( STORE_NAME ).receiveGetClients( fixtures.clients, { accountID: fixtures.accounts[ 0 ].id } );
		registry.dispatch( STORE_NAME ).receiveGetAlerts( fixtures.alerts, { accountID: fixtures.accounts[ 0 ].id } );
		registry.dispatch( STORE_NAME ).receiveGetURLChannels( [], {
			accountID: fixtures.accounts[ 0 ].id,
			clientID: fixtures.clients[ 0 ].id,
		} );

		return <Setup registry={ registry } />;
	} )
	.add( 'Already approved account (existing tag with permission)', ( registry ) => {
		registry.dispatch( STORE_NAME ).receiveGetSettings( defaultSettings );
		registry.dispatch( STORE_NAME ).receiveIsAdBlockerActive( false );
		registry.dispatch( STORE_NAME ).receiveGetExistingTag( fixtures.clients[ 0 ].id );
		registry.dispatch( STORE_NAME ).receiveGetTagPermission( {
			accountID: fixtures.accounts[ 0 ].id,
			permission: true,
		}, { clientID: fixtures.clients[ 0 ].id } );
		registry.dispatch( STORE_NAME ).receiveGetAccounts( fixtures.accounts );
		registry.dispatch( STORE_NAME ).receiveGetClients( fixtures.clients, { accountID: fixtures.accounts[ 0 ].id } );
		registry.dispatch( STORE_NAME ).receiveGetAlerts( fixtures.alerts, { accountID: fixtures.accounts[ 0 ].id } );
		registry.dispatch( STORE_NAME ).receiveGetURLChannels( [], {
			accountID: fixtures.accounts[ 0 ].id,
			clientID: fixtures.clients[ 0 ].id,
		} );

		return <Setup registry={ registry } />;
	} )
	.add( 'Already approved account (existing tag without permission)', ( registry ) => {
		registry.dispatch( STORE_NAME ).receiveGetSettings( defaultSettings );
		registry.dispatch( STORE_NAME ).receiveIsAdBlockerActive( false );
		registry.dispatch( STORE_NAME ).receiveGetExistingTag( 'ca-pub-123456789' );
		registry.dispatch( STORE_NAME ).receiveGetTagPermission( {
			accountID: 'pub-123456789',
			permission: false,
		}, { clientID: 'ca-pub-123456789' } );
		registry.dispatch( STORE_NAME ).receiveGetAccounts( fixtures.accounts );
		registry.dispatch( STORE_NAME ).receiveGetClients( fixtures.clients, { accountID: fixtures.accounts[ 0 ].id } );
		registry.dispatch( STORE_NAME ).receiveGetAlerts( fixtures.alerts, { accountID: fixtures.accounts[ 0 ].id } );
		registry.dispatch( STORE_NAME ).receiveGetURLChannels( [], {
			accountID: fixtures.accounts[ 0 ].id,
			clientID: fixtures.clients[ 0 ].id,
		} );

		return <Setup registry={ registry } />;
	} )
	.add( 'Site not added', ( registry ) => {
		registry.dispatch( STORE_NAME ).receiveGetSettings( accountCompleteSettings );
		registry.dispatch( STORE_NAME ).receiveIsAdBlockerActive( false );
		registry.dispatch( STORE_NAME ).receiveGetExistingTag( null );
		registry.dispatch( STORE_NAME ).receiveGetAccounts( fixtures.accounts );
		registry.dispatch( STORE_NAME ).receiveGetClients( fixtures.clients, { accountID: fixtures.accounts[ 0 ].id } );
		registry.dispatch( STORE_NAME ).receiveGetAlerts( fixtures.alerts, { accountID: fixtures.accounts[ 0 ].id } );
		registry.dispatch( STORE_NAME ).receiveGetURLChannels( [], {
			accountID: fixtures.accounts[ 0 ].id,
			clientID: fixtures.clients[ 0 ].id,
		} );

		return <Setup registry={ registry } />;
	} )
	.add( 'Site added', ( registry ) => {
		registry.dispatch( STORE_NAME ).receiveGetSettings( accountCompleteSettings );
		registry.dispatch( STORE_NAME ).receiveIsAdBlockerActive( false );
		registry.dispatch( STORE_NAME ).receiveGetExistingTag( null );
		registry.dispatch( STORE_NAME ).receiveGetAccounts( fixtures.accounts );
		registry.dispatch( STORE_NAME ).receiveGetClients( fixtures.clients, { accountID: fixtures.accounts[ 0 ].id } );
		registry.dispatch( STORE_NAME ).receiveGetAlerts( fixtures.alerts, { accountID: fixtures.accounts[ 0 ].id } );
		registry.dispatch( STORE_NAME ).receiveGetURLChannels(
			fixtures.urlchannels,
			{
				accountID: fixtures.accounts[ 0 ].id,
				clientID: fixtures.clients[ 0 ].id,
			}
		);

		return <Setup registry={ registry } />;
	} )
;
