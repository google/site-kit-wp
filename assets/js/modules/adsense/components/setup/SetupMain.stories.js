/**
 * SetupMain Component Stories.
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
import { Cell, Grid, Row } from '../../../../material-components';
import WithRegistrySetup from '../../../../../../tests/js/WithRegistrySetup';
import * as fixtures from '../../datastore/__fixtures__';
import {
	createTestRegistry,
	WithTestRegistry,
	provideModules,
	provideSiteInfo,
} from '../../../../../../tests/js/utils';
import { MODULES_ADSENSE } from '../../datastore/constants';
import { CORE_USER } from '../../../../googlesitekit/datastore/user/constants';

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
			<div className="googlesitekit-setup">
				<section className="googlesitekit-setup__wrapper">
					<Grid>
						<Row>
							<Cell size={ 12 }>
								<SetupMain />
							</Cell>
						</Row>
					</Grid>
				</section>
			</div>
		</WithRegistrySetup>
	);
}

function createSetupAccountStory( variation, args = {} ) {
	const {
		accounts = fixtures.accounts,
		clients = fixtures.clients,
		sites = fixtures.sites,
		referenceSiteURL = 'https://example.com',
		existingTag = false,
	} = args;

	const story = Template.bind( {} );
	story.storyName = `Account: ${ variation }`;
	story.args = {
		setupRegistry: ( registry ) => {
			const { _id: accountID } = accounts[ 0 ];
			const {
				receiveGetAccounts,
				receiveGetClients,
				receiveGetSettings,
				receiveGetSites,
				receiveGetExistingTag,
				setAccountID,
			} = registry.dispatch( MODULES_ADSENSE );

			provideSiteInfo( registry, {
				referenceSiteURL,
			} );

			receiveGetAccounts( accounts );
			receiveGetClients( clients, { accountID } );
			receiveGetSites( sites, { accountID } );
			receiveGetSettings( { ...defaultSettings, accountID } );
			setAccountID( accountID );

			if ( existingTag ) {
				receiveGetExistingTag( 'ca-pub-2833782679114991' );
			}
		},
	};

	return story;
}

export const AdBlocker = Template.bind( {} );
AdBlocker.storyName = 'AdBlocker Active';
AdBlocker.args = {
	setupRegistry: ( registry ) => {
		registry.dispatch( CORE_USER ).receiveIsAdBlockerActive( true );
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
export const SetupAccountSiteReadyWithTag = createSetupAccountStory(
	'Site - Ready w Ads Enabled + Existing Tag',
	{
		referenceSiteURL: 'https://some-other-tld.ie',
		existingTag: true,
	}
);
export const SetupAccountSiteReadyAdsDisabled = createSetupAccountStory(
	'Site - Ready w Ads Disabled',
	{
		referenceSiteURL: 'https://foo-bar.ie',
	}
);
export const SetupAccountSiteReadyAdsDisabledWithTag = createSetupAccountStory(
	'Site - Ready w Ads Disabled + Existing Tag',
	{
		referenceSiteURL: 'https://foo-bar.ie',
		existingTag: true,
	}
);
export const SetupAccountSiteErrorState = createSetupAccountStory(
	'Site - Invalid Site State',
	{
		referenceSiteURL: 'https://invalid-error-site.com',
		sites: [
			{
				domain: 'invalid-error-site.com',
				state: 'NON_EXISTENT_SITE_STATE',
			},
		],
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
		existingTag: true,
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
			{
				_id: 'pub-2833782679114992',
				name: 'accounts/pub-2833782679114992',
				displayName: 'Test Account 2',
				timeZone: {
					id: 'Europe/Berlin',
				},
				createTime: '2013-10-18T15:51:03.000Z',
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
				message: 'AdSense account is disapproved.',
				data: {
					status: 403,
					reason: 'disapprovedAccount',
				},
			},
			'getAccounts',
			[]
		);
	},
};

export default {
	title: 'Modules/AdSense/Components/Setup/SetupMain',
	component: SetupMain,
	decorators: [
		( Story ) => {
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
			registry.dispatch( CORE_USER ).receiveIsAdBlockerActive( false );

			return (
				<WithTestRegistry registry={ registry }>
					<Story />
				</WithTestRegistry>
			);
		},
	],
	parameters: { padding: 0 },
};
