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

const Template = ( { setupRegistry } ) => (
	<WithRegistrySetup func={ setupRegistry }>
		<SetupMain />
	</WithRegistrySetup>
);

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

export const SetupAccount = Template.bind( {} );
SetupAccount.storyName = 'Account';
SetupAccount.args = {
	setupRegistry: ( registry ) => {
		registry
			.dispatch( MODULES_ADSENSE )
			.receiveGetAccounts( fixtures.accounts );
	},
};

export const SelectAccount = Template.bind( {} );
SelectAccount.storyName = 'Select Account';
SelectAccount.args = {
	setupRegistry: ( registry ) => {
		registry.dispatch( MODULES_ADSENSE ).receiveGetAccounts( [
			{
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

export default {
	title: 'Modules/AdSense/Components/Setup/V2/SetupMain',
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
			registry
				.dispatch( MODULES_ADSENSE )
				.receiveIsAdBlockerActive( false );

			return (
				<WithTestRegistry registry={ registry }>
					<Story />
				</WithTestRegistry>
			);
		},
	],
};
