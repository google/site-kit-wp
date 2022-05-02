/**
 * SetupMainv2 Component Stories.
 *
 * Site Kit by Google, Copyright 2022 Google LLC
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
import SetupMain from './SetupMain';
import WithRegistrySetup from '../../../../../../../tests/js/WithRegistrySetup';
import * as fixtures from '../../../datastore/__fixtures__';
import {
	createTestRegistry,
	WithTestRegistry,
	provideModules,
	provideSiteInfo,
} from '../../../../../../../tests/js/utils';
import { MODULES_ADSENSE } from '../../../datastore/constants';

const defaultSettings = {
	accountID: '',
	clientID: '',
	accountStatus: '',
	siteStatus: '',
	useSnippet: true,
	accountSetupComplete: false,
	siteSetupComplete: false,
};

function Template( { setupRegistry } ) {
	return (
		<WithRegistrySetup func={ setupRegistry }>
			<SetupMain />
		</WithRegistrySetup>
	);
}

function createSetupAccountStory( variation, args = {} ) {
	const {
		accounts = fixtures.accounts,
		clients = fixtures.clients,
		sites = fixtures.sites,
		referenceSiteURL = 'https://example.com',
	} = args;

	const story = Template.bind( {} );
	story.storyName = `Account: ${ variation }`;
	story.args = {
		setupRegistry: ( registry ) => {
			const { _id: accountID } = accounts[ 0 ];
			const {
				receiveGetAccounts,
				receiveGetAlerts,
				receiveGetClients,
				receiveGetSettings,
				receiveGetSites,
				receiveGetURLChannels,
			} = registry.dispatch( MODULES_ADSENSE );

			provideSiteInfo( registry, {
				referenceSiteURL,
			} );

			receiveGetAccounts( accounts );
			receiveGetClients( clients, { accountID } );
			receiveGetSites( sites, { accountID } );
			receiveGetSettings( { ...defaultSettings, accountID } );
			receiveGetAlerts( fixtures.alerts, { accountID } );

			registry.dispatch( MODULES_ADSENSE ).setAccountID( accountID );

			const clientID = clients.find(
				( { _accountID } ) => _accountID === accountID
			)?._id;

			if ( clientID ) {
				receiveGetURLChannels( fixtures.urlchannels, {
					accountID,
					clientID,
				} );
			}
		},
	};

	return story;
}

export const AdBlocker = Template.bind( {} );
AdBlocker.storyName = 'AdBlocker Active';
AdBlocker.args = {
	setupRegistry: ( registry ) => {
		registry.dispatch( MODULES_ADSENSE ).receiveIsAdBlockerActive( true );
		registry.dispatch( MODULES_ADSENSE ).receiveGetAccounts( [] );
	},
};

export const CreateAccount = Template.bind( {} );
CreateAccount.storyName = 'Create Account';
CreateAccount.args = {
	setupRegistry: ( registry ) => {
		registry.dispatch( MODULES_ADSENSE ).receiveGetAccounts( [] );
	},
};

export const SetupAccountSite = createSetupAccountStory( 'Site' );
export const SetupAccountSiteNeedsAttention = createSetupAccountStory(
	'Site - Needs Attention',
	{
		referenceSiteURL: 'https://example.com',
	}
);
export const SetupAccountSiteRequiresReview = createSetupAccountStory(
	'Site - Requires Review',
	{
		referenceSiteURL: 'https://www.test-site.com',
	}
);
export const SetupAccountSiteGettingReady = createSetupAccountStory(
	'Site - Getting Ready',
	{
		referenceSiteURL: 'https://bar-baz.ie',
	}
);
export const SetupAccountSiteReady = createSetupAccountStory(
	'Site - Ready w Ads Enabled',
	{
		referenceSiteURL: 'https://some-other-tld.ie',
	}
);
export const SetupAccountSiteReadyAdsDisabled = createSetupAccountStory(
	'Site - Ready w Ads Disabled',
	{
		referenceSiteURL: 'https://foo-bar.ie',
	}
);
export const SetupAccountNoClient = createSetupAccountStory( 'No Client', {
	clients: [ { ...fixtures.clients[ 0 ], productCode: '' } ],
} );
export const SetupAccountCreateSite = createSetupAccountStory( 'Create Site', {
	sites: [],
} );
export const SetupAccountPendingTasks = createSetupAccountStory(
	'Pending Tasks',
	{
		accounts: [
			{
				...fixtures.accountsMultiple[ 3 ],
				pendingTasks: [
					{
						_id: '1234',
					},
				],
			},
		],
	}
);

export const SelectAccount = Template.bind( {} );
SelectAccount.storyName = 'Select Account';
SelectAccount.args = {
	setupRegistry: ( registry ) => {
		registry.dispatch( MODULES_ADSENSE ).receiveGetAccounts( [
			{
				_id: 'pub-2833782679114991',
				name: 'accounts/pub-2833782679114991',
				displayName: 'Test Account',
				timeZone: {
					id: 'Europe/Berlin',
				},
				createTime: '2013-10-17T15:51:03.000Z',
			},
		] );
	},
};

export const ErrorNotice = Template.bind( {} );
ErrorNotice.storyName = 'Error Notice';
ErrorNotice.args = {
	setupRegistry: ( registry ) => {
		registry.dispatch( MODULES_ADSENSE ).receiveGetAccounts( [] );
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
	},
};
ErrorNotice.parameters = {
	features: [ 'adsenseSetupV2' ],
};

export default {
	title: 'Modules/AdSense/Components/Setup/V2/SetupMain',
	component: SetupMain,
	decorators: [
		( Story, { parameters } ) => {
			const registry = createTestRegistry();

			provideModules( registry, [
				{
					slug: 'adsense',
					active: true,
					connected: true,
				},
			] );

			registry
				.dispatch( MODULES_ADSENSE )
				.receiveGetSettings( defaultSettings );
			registry
				.dispatch( MODULES_ADSENSE )
				.receiveIsAdBlockerActive( false );

			return (
				<WithTestRegistry
					registry={ registry }
					features={ parameters.features || [] }
				>
					<Story />
				</WithTestRegistry>
			);
		},
	],
};
