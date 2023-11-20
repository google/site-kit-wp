/**
 * AdSense Setup stories.
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
import ModuleSetup from '../assets/js/components/setup/ModuleSetup';
import * as fixtures from '../assets/js/modules/adsense/datastore/__fixtures__';
import { MODULES_ADSENSE } from '../assets/js/modules/adsense/datastore/constants';
import {
	WithTestRegistry,
	createTestRegistry,
	provideModules,
	provideModuleRegistrations,
} from '../tests/js/utils';

function Setup( props ) {
	return (
		<WithTestRegistry { ...props }>
			<ModuleSetup moduleSlug="adsense" />
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
	accountID: fixtures.accounts[ 0 ]._id,
	clientID: fixtures.clients[ 0 ]._id,
	accountStatus: '',
	siteStatus: '',
	useSnippet: false,
	accountSetupComplete: true,
	siteSetupComplete: false,
};

const withRegistry = ( Story ) => {
	const registry = createTestRegistry();
	provideModules( registry, [
		{
			slug: 'adsense',
			active: true,
			connected: true,
		},
	] );
	provideModuleRegistrations( registry );

	return <Story registry={ registry } />;
};

storiesOf( 'AdSense Module/Setup', module )
	.add(
		'Loading',
		( args, { registry } ) => {
			registry
				.dispatch( MODULES_ADSENSE )
				.receiveGetSettings( defaultSettings );
			registry
				.dispatch( MODULES_ADSENSE )
				.receiveIsAdBlockerActive( false );

			return <Setup registry={ registry } />;
		},
		{
			decorators: [ withRegistry ],
			padding: 0,
		}
	)
	.add(
		'AdBlocker active',
		( args, { registry } ) => {
			registry
				.dispatch( MODULES_ADSENSE )
				.receiveGetSettings( defaultSettings );
			registry
				.dispatch( MODULES_ADSENSE )
				.receiveIsAdBlockerActive( true );
			registry.dispatch( MODULES_ADSENSE ).receiveGetExistingTag( null );
			registry
				.dispatch( MODULES_ADSENSE )
				.receiveGetAccounts( fixtures.accounts );
			registry
				.dispatch( MODULES_ADSENSE )
				.receiveGetClients( fixtures.clients, {
					accountID: fixtures.accounts[ 0 ]._id,
				} );
			registry.dispatch( MODULES_ADSENSE ).receiveGetAlerts( [], {
				accountID: fixtures.accounts[ 0 ]._id,
			} );
			registry.dispatch( MODULES_ADSENSE ).receiveGetURLChannels( [], {
				accountID: fixtures.accounts[ 0 ]._id,
				clientID: fixtures.clients[ 0 ]._id,
			} );

			return <Setup registry={ registry } />;
		},
		{
			decorators: [ withRegistry ],
			padding: 0,
		}
	)
	.add(
		'No account',
		( args, { registry } ) => {
			registry
				.dispatch( MODULES_ADSENSE )
				.receiveGetSettings( defaultSettings );
			registry
				.dispatch( MODULES_ADSENSE )
				.receiveIsAdBlockerActive( false );
			registry.dispatch( MODULES_ADSENSE ).receiveGetExistingTag( null );
			registry
				.dispatch( MODULES_ADSENSE )
				.finishResolution( 'getAccounts', [] );
			registry.dispatch( MODULES_ADSENSE ).receiveError(
				{
					// Typically thrown when fetching accounts.
					message: 'No account.',
					data: {
						reason: 'noAdSenseAccount',
					},
				},
				'getAccounts',
				[]
			);

			return <Setup registry={ registry } />;
		},
		{
			decorators: [ withRegistry ],
			padding: 0,
		}
	)
	.add(
		'No account (existing tag)',
		( args, { registry } ) => {
			registry
				.dispatch( MODULES_ADSENSE )
				.receiveGetSettings( defaultSettings );
			registry
				.dispatch( MODULES_ADSENSE )
				.receiveIsAdBlockerActive( false );
			registry
				.dispatch( MODULES_ADSENSE )
				.receiveGetExistingTag( 'ca-pub-123456789' );
			registry
				.dispatch( MODULES_ADSENSE )
				.finishResolution( 'getAccounts', [] );
			registry.dispatch( MODULES_ADSENSE ).receiveError(
				{
					// Typically thrown when fetching accounts.
					message: 'No account.',
					data: {
						reason: 'noAdSenseAccount',
					},
				},
				'getAccounts',
				[]
			);

			return <Setup registry={ registry } />;
		},
		{
			decorators: [ withRegistry ],
			padding: 0,
		}
	)
	.add(
		'Multiple accounts',
		( args, { registry } ) => {
			registry
				.dispatch( MODULES_ADSENSE )
				.receiveGetSettings( defaultSettings );
			registry
				.dispatch( MODULES_ADSENSE )
				.receiveIsAdBlockerActive( false );
			registry.dispatch( MODULES_ADSENSE ).receiveGetExistingTag( null );
			registry
				.dispatch( MODULES_ADSENSE )
				.receiveGetAccounts( fixtures.accountsMultiple );
			registry
				.dispatch( MODULES_ADSENSE )
				.receiveGetClients( fixtures.clients, {
					accountID: fixtures.accountsMultiple[ 0 ]._id,
				} );
			registry.dispatch( MODULES_ADSENSE ).receiveGetClients(
				[
					{
						...fixtures.clients[ 0 ],
						id: `ca-${ fixtures.accountsMultiple[ 1 ]._id }`,
					},
				],
				{ accountID: fixtures.accountsMultiple[ 1 ]._id }
			);
			registry.dispatch( MODULES_ADSENSE ).receiveGetAlerts( [], {
				accountID: fixtures.accountsMultiple[ 0 ]._id,
			} );
			registry.dispatch( MODULES_ADSENSE ).receiveGetAlerts( [], {
				accountID: fixtures.accountsMultiple[ 1 ]._id,
			} );
			registry.dispatch( MODULES_ADSENSE ).receiveGetURLChannels( [], {
				accountID: fixtures.accountsMultiple[ 0 ]._id,
				clientID: fixtures.clients[ 0 ]._id,
			} );
			registry.dispatch( MODULES_ADSENSE ).receiveGetURLChannels( [], {
				accountID: fixtures.accountsMultiple[ 1 ]._id,
				clientID: `ca-${ fixtures.accountsMultiple[ 1 ]._id }`,
			} );

			return <Setup registry={ registry } />;
		},
		{
			decorators: [ withRegistry ],
			padding: 0,
		}
	)
	.add(
		'Disapproved account',
		( args, { registry } ) => {
			registry
				.dispatch( MODULES_ADSENSE )
				.receiveGetSettings( defaultSettings );
			registry
				.dispatch( MODULES_ADSENSE )
				.receiveIsAdBlockerActive( false );
			registry.dispatch( MODULES_ADSENSE ).receiveGetExistingTag( null );
			registry
				.dispatch( MODULES_ADSENSE )
				.finishResolution( 'getAccounts', [] );
			registry.dispatch( MODULES_ADSENSE ).receiveError(
				{
					// Typically thrown when fetching accounts.
					message: 'Disapproved account.',
					data: {
						reason: 'disapprovedAccount',
					},
				},
				'getAccounts',
				[]
			);

			return <Setup registry={ registry } />;
		},
		{
			decorators: [ withRegistry ],
			padding: 0,
		}
	)
	.add(
		'Graylisted account',
		( args, { registry } ) => {
			registry
				.dispatch( MODULES_ADSENSE )
				.receiveGetSettings( defaultSettings );
			registry
				.dispatch( MODULES_ADSENSE )
				.receiveIsAdBlockerActive( false );
			registry.dispatch( MODULES_ADSENSE ).receiveGetExistingTag( null );
			registry
				.dispatch( MODULES_ADSENSE )
				.receiveGetAccounts( fixtures.accounts );
			registry
				.dispatch( MODULES_ADSENSE )
				.receiveGetClients( fixtures.clients, {
					accountID: fixtures.accounts[ 0 ]._id,
				} );
			registry
				.dispatch( MODULES_ADSENSE )
				.receiveGetAlerts( fixtures.alertsGraylisted, {
					accountID: fixtures.accounts[ 0 ]._id,
				} );
			registry.dispatch( MODULES_ADSENSE ).receiveGetURLChannels( [], {
				accountID: fixtures.accounts[ 0 ]._id,
				clientID: fixtures.clients[ 0 ]._id,
			} );

			return <Setup registry={ registry } />;
		},
		{
			decorators: [ withRegistry ],
			padding: 0,
		}
	)
	.add(
		'Pending account',
		( args, { registry } ) => {
			registry
				.dispatch( MODULES_ADSENSE )
				.receiveGetSettings( defaultSettings );
			registry
				.dispatch( MODULES_ADSENSE )
				.receiveIsAdBlockerActive( false );
			registry.dispatch( MODULES_ADSENSE ).receiveGetExistingTag( null );
			registry
				.dispatch( MODULES_ADSENSE )
				.receiveGetAccounts( fixtures.accounts );
			registry
				.dispatch( MODULES_ADSENSE )
				.receiveGetClients( fixtures.clients, {
					accountID: fixtures.accounts[ 0 ]._id,
				} );
			registry.dispatch( MODULES_ADSENSE ).receiveGetURLChannels( [], {
				accountID: fixtures.accounts[ 0 ]._id,
				clientID: fixtures.clients[ 0 ]._id,
			} );

			return <Setup registry={ registry } />;
		},
		{
			decorators: [ withRegistry ],
			padding: 0,
		}
	)
	.add(
		'Account without AFC client (AdMob)',
		( args, { registry } ) => {
			registry
				.dispatch( MODULES_ADSENSE )
				.receiveGetSettings( defaultSettings );
			registry
				.dispatch( MODULES_ADSENSE )
				.receiveIsAdBlockerActive( false );
			registry.dispatch( MODULES_ADSENSE ).receiveGetExistingTag( null );
			registry
				.dispatch( MODULES_ADSENSE )
				.receiveGetAccounts( fixtures.accounts );
			registry
				.dispatch( MODULES_ADSENSE )
				.receiveGetClients( fixtures.clientsNoAFC, {
					accountID: fixtures.accounts[ 0 ]._id,
				} );
			registry
				.dispatch( MODULES_ADSENSE )
				.receiveGetAlerts( fixtures.alerts, {
					accountID: fixtures.accounts[ 0 ]._id,
				} );

			return <Setup registry={ registry } />;
		},
		{
			decorators: [ withRegistry ],
			padding: 0,
		}
	)
	.add(
		'Newly approved account',
		( args, { registry } ) => {
			registry.dispatch( MODULES_ADSENSE ).receiveGetSettings( {
				...defaultSettings,
				// Previous status needs to be something other than
				// '' or 'approved'.
				accountStatus: 'pending',
			} );
			registry
				.dispatch( MODULES_ADSENSE )
				.receiveIsAdBlockerActive( false );
			registry.dispatch( MODULES_ADSENSE ).receiveGetExistingTag( null );
			registry
				.dispatch( MODULES_ADSENSE )
				.receiveGetAccounts( fixtures.accounts );
			registry
				.dispatch( MODULES_ADSENSE )
				.receiveGetClients( fixtures.clients, {
					accountID: fixtures.accounts[ 0 ]._id,
				} );
			registry
				.dispatch( MODULES_ADSENSE )
				.receiveGetAlerts( fixtures.alerts, {
					accountID: fixtures.accounts[ 0 ]._id,
				} );
			registry.dispatch( MODULES_ADSENSE ).receiveGetURLChannels( [], {
				accountID: fixtures.accounts[ 0 ]._id,
				clientID: fixtures.clients[ 0 ]._id,
			} );

			return <Setup registry={ registry } />;
		},
		{
			decorators: [ withRegistry ],
			padding: 0,
		}
	)
	.add(
		'Newly approved account (existing tag with permission)',
		( args, { registry } ) => {
			registry.dispatch( MODULES_ADSENSE ).receiveGetSettings( {
				...defaultSettings,
				// Previous status needs to be something other than
				// '' or 'approved'.
				accountStatus: 'pending',
			} );
			registry
				.dispatch( MODULES_ADSENSE )
				.receiveIsAdBlockerActive( false );
			registry
				.dispatch( MODULES_ADSENSE )
				.receiveGetExistingTag( fixtures.clients[ 0 ]._id );
			registry
				.dispatch( MODULES_ADSENSE )
				.receiveGetAccounts( fixtures.accounts );
			registry
				.dispatch( MODULES_ADSENSE )
				.receiveGetClients( fixtures.clients, {
					accountID: fixtures.accounts[ 0 ]._id,
				} );
			registry
				.dispatch( MODULES_ADSENSE )
				.receiveGetAlerts( fixtures.alerts, {
					accountID: fixtures.accounts[ 0 ]._id,
				} );
			registry.dispatch( MODULES_ADSENSE ).receiveGetURLChannels( [], {
				accountID: fixtures.accounts[ 0 ]._id,
				clientID: fixtures.clients[ 0 ]._id,
			} );

			return <Setup registry={ registry } />;
		},
		{
			decorators: [ withRegistry ],
			padding: 0,
		}
	)
	.add(
		'Newly approved account (existing tag without permission)',
		( args, { registry } ) => {
			registry.dispatch( MODULES_ADSENSE ).receiveGetSettings( {
				...defaultSettings,
				// Previous status needs to be something other than
				// '' or 'approved'.
				accountStatus: 'pending',
			} );
			registry
				.dispatch( MODULES_ADSENSE )
				.receiveIsAdBlockerActive( false );
			registry
				.dispatch( MODULES_ADSENSE )
				.receiveGetExistingTag( 'ca-pub-123456789' );
			registry
				.dispatch( MODULES_ADSENSE )
				.receiveGetAccounts( fixtures.accounts );
			registry
				.dispatch( MODULES_ADSENSE )
				.receiveGetClients( fixtures.clients, {
					accountID: fixtures.accounts[ 0 ]._id,
				} );
			registry
				.dispatch( MODULES_ADSENSE )
				.receiveGetAlerts( fixtures.alerts, {
					accountID: fixtures.accounts[ 0 ]._id,
				} );
			registry.dispatch( MODULES_ADSENSE ).receiveGetURLChannels( [], {
				accountID: fixtures.accounts[ 0 ]._id,
				clientID: fixtures.clients[ 0 ]._id,
			} );

			return <Setup registry={ registry } />;
		},
		{
			decorators: [ withRegistry ],
			padding: 0,
		}
	)
	.add(
		'Already approved account',
		( args, { registry } ) => {
			registry
				.dispatch( MODULES_ADSENSE )
				.receiveGetSettings( defaultSettings );
			registry
				.dispatch( MODULES_ADSENSE )
				.receiveIsAdBlockerActive( false );
			registry.dispatch( MODULES_ADSENSE ).receiveGetExistingTag( null );
			registry
				.dispatch( MODULES_ADSENSE )
				.receiveGetAccounts( fixtures.accounts );
			registry
				.dispatch( MODULES_ADSENSE )
				.receiveGetClients( fixtures.clients, {
					accountID: fixtures.accounts[ 0 ]._id,
				} );
			registry
				.dispatch( MODULES_ADSENSE )
				.receiveGetAlerts( fixtures.alerts, {
					accountID: fixtures.accounts[ 0 ]._id,
				} );
			registry.dispatch( MODULES_ADSENSE ).receiveGetURLChannels( [], {
				accountID: fixtures.accounts[ 0 ]._id,
				clientID: fixtures.clients[ 0 ]._id,
			} );

			return <Setup registry={ registry } />;
		},
		{
			decorators: [ withRegistry ],
			padding: 0,
		}
	)
	.add(
		'Already approved account (existing tag with permission)',
		( args, { registry } ) => {
			registry
				.dispatch( MODULES_ADSENSE )
				.receiveGetSettings( defaultSettings );
			registry
				.dispatch( MODULES_ADSENSE )
				.receiveIsAdBlockerActive( false );
			registry
				.dispatch( MODULES_ADSENSE )
				.receiveGetExistingTag( fixtures.clients[ 0 ]._id );
			registry
				.dispatch( MODULES_ADSENSE )
				.receiveGetAccounts( fixtures.accounts );
			registry
				.dispatch( MODULES_ADSENSE )
				.receiveGetClients( fixtures.clients, {
					accountID: fixtures.accounts[ 0 ]._id,
				} );
			registry
				.dispatch( MODULES_ADSENSE )
				.receiveGetAlerts( fixtures.alerts, {
					accountID: fixtures.accounts[ 0 ]._id,
				} );
			registry.dispatch( MODULES_ADSENSE ).receiveGetURLChannels( [], {
				accountID: fixtures.accounts[ 0 ]._id,
				clientID: fixtures.clients[ 0 ]._id,
			} );

			return <Setup registry={ registry } />;
		},
		{
			decorators: [ withRegistry ],
			padding: 0,
		}
	)
	.add(
		'Already approved account (existing tag without permission)',
		( args, { registry } ) => {
			registry
				.dispatch( MODULES_ADSENSE )
				.receiveGetSettings( defaultSettings );
			registry
				.dispatch( MODULES_ADSENSE )
				.receiveIsAdBlockerActive( false );
			registry
				.dispatch( MODULES_ADSENSE )
				.receiveGetExistingTag( 'ca-pub-123456789' );
			registry
				.dispatch( MODULES_ADSENSE )
				.receiveGetAccounts( fixtures.accounts );
			registry
				.dispatch( MODULES_ADSENSE )
				.receiveGetClients( fixtures.clients, {
					accountID: fixtures.accounts[ 0 ]._id,
				} );
			registry
				.dispatch( MODULES_ADSENSE )
				.receiveGetAlerts( fixtures.alerts, {
					accountID: fixtures.accounts[ 0 ]._id,
				} );
			registry.dispatch( MODULES_ADSENSE ).receiveGetURLChannels( [], {
				accountID: fixtures.accounts[ 0 ]._id,
				clientID: fixtures.clients[ 0 ]._id,
			} );

			return <Setup registry={ registry } />;
		},
		{
			decorators: [ withRegistry ],
			padding: 0,
		}
	)
	.add(
		'Site not added',
		( args, { registry } ) => {
			registry
				.dispatch( MODULES_ADSENSE )
				.receiveGetSettings( accountCompleteSettings );
			registry
				.dispatch( MODULES_ADSENSE )
				.receiveIsAdBlockerActive( false );
			registry.dispatch( MODULES_ADSENSE ).receiveGetExistingTag( null );
			registry
				.dispatch( MODULES_ADSENSE )
				.receiveGetAccounts( fixtures.accounts );
			registry
				.dispatch( MODULES_ADSENSE )
				.receiveGetClients( fixtures.clients, {
					accountID: fixtures.accounts[ 0 ]._id,
				} );
			registry
				.dispatch( MODULES_ADSENSE )
				.receiveGetAlerts( fixtures.alerts, {
					accountID: fixtures.accounts[ 0 ]._id,
				} );
			registry.dispatch( MODULES_ADSENSE ).receiveGetURLChannels( [], {
				accountID: fixtures.accounts[ 0 ]._id,
				clientID: fixtures.clients[ 0 ]._id,
			} );

			return <Setup registry={ registry } />;
		},
		{
			decorators: [ withRegistry ],
			padding: 0,
		}
	)
	.add(
		'Site added',
		( args, { registry } ) => {
			registry
				.dispatch( MODULES_ADSENSE )
				.receiveGetSettings( accountCompleteSettings );
			registry
				.dispatch( MODULES_ADSENSE )
				.receiveIsAdBlockerActive( false );
			registry.dispatch( MODULES_ADSENSE ).receiveGetExistingTag( null );
			registry
				.dispatch( MODULES_ADSENSE )
				.receiveGetAccounts( fixtures.accounts );
			registry
				.dispatch( MODULES_ADSENSE )
				.receiveGetClients( fixtures.clients, {
					accountID: fixtures.accounts[ 0 ]._id,
				} );
			registry
				.dispatch( MODULES_ADSENSE )
				.receiveGetAlerts( fixtures.alerts, {
					accountID: fixtures.accounts[ 0 ]._id,
				} );
			registry
				.dispatch( MODULES_ADSENSE )
				.receiveGetURLChannels( fixtures.urlchannels, {
					accountID: fixtures.accounts[ 0 ]._id,
					clientID: fixtures.clients[ 0 ]._id,
				} );

			return <Setup registry={ registry } />;
		},
		{
			decorators: [ withRegistry ],
			padding: 0,
		}
	);
