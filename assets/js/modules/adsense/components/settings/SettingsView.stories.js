/**
 * AdSense SettingsView component stories.
 *
 * Site Kit by Google, Copyright 2024 Google LLC
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
import * as fixtures from '../../datastore/__fixtures__';
import SettingsView from './SettingsView';
import { Cell, Grid, Row } from '../../../../material-components';
import WithRegistrySetup from '../../../../../../tests/js/WithRegistrySetup';
import { MODULES_ADSENSE } from '../../datastore/constants';
import {
	ACCOUNT_STATUS_APPROVED,
	ACCOUNT_STATUS_PENDING,
	SITE_STATUS_ADDED,
} from '../../util';
import { CORE_USER } from '../../../../googlesitekit/datastore/user/constants';
import {
	provideModuleRegistrations,
	provideModules,
	provideSiteInfo,
	provideUserAuthentication,
} from '../../../../../../tests/js/utils';

const adSenseSettings = {
	accountID: fixtures.accounts[ 0 ]._id,
	adBlockingRecoverySetupStatus: '',
	clientID: fixtures.clients[ 0 ]._id,
	accountStatus: ACCOUNT_STATUS_APPROVED,
	siteStatus: SITE_STATUS_ADDED,
	useSnippet: true,
	accountSetupComplete: true,
	siteSetupComplete: true,
	webStoriesAdUnit: '0123456789',
	webStoriesActive: true,
	ownerID: 0,
};

function Template() {
	return (
		<div className="googlesitekit-layout">
			<div className="googlesitekit-settings-module googlesitekit-settings-module--active googlesitekit-settings-module--adsense">
				<div className="googlesitekit-settings-module__content googlesitekit-settings-module__content--open">
					<Grid>
						<Row>
							<Cell size={ 12 }>
								<SettingsView />
							</Cell>
						</Row>
					</Grid>
				</div>
			</div>
		</div>
	);
}

export const SetupIncomplete = Template.bind( {} );
SetupIncomplete.storyName = 'Setup Incomplete';
SetupIncomplete.args = {
	setupRegistry: ( registry ) => {
		registry.dispatch( MODULES_ADSENSE ).receiveGetSettings( {
			...adSenseSettings,
			accountStatus: ACCOUNT_STATUS_PENDING,
			accountSetupComplete: false,
			siteSetupComplete: false,
		} );
	},
};

export const SetupComplete = Template.bind( {} );
SetupComplete.storyName = 'Setup Complete';
SetupComplete.args = {
	setupRegistry: ( registry ) => {
		registry
			.dispatch( MODULES_ADSENSE )
			.receiveGetSettings( adSenseSettings );
	},
};

export const AdBlockingRecoveryNotPlaced = Template.bind( {} );
AdBlockingRecoveryNotPlaced.storyName = 'Ad Blocking Recovery Not Placed';
AdBlockingRecoveryNotPlaced.args = {
	setupRegistry: ( registry ) => {
		registry.dispatch( MODULES_ADSENSE ).receiveGetSettings( {
			...adSenseSettings,
			adBlockingRecoverySetupStatus: 'setup-confirmed',
			useAdBlockingRecoverySnippet: false,
		} );
	},
};

export const AdBlockingRecoveryPlaced = Template.bind( {} );
AdBlockingRecoveryPlaced.storyName = 'Ad Blocking Recovery Placed';
AdBlockingRecoveryPlaced.args = {
	setupRegistry: ( registry ) => {
		registry.dispatch( MODULES_ADSENSE ).receiveGetSettings( {
			...adSenseSettings,
			adBlockingRecoverySetupStatus: 'tag-placed',
			useAdBlockingRecoverySnippet: true,
		} );
	},
};

export default {
	title: 'Modules/AdSense/Settings/SettingsView',
	component: SettingsView,
	decorators: [
		( Story, { args } ) => {
			const setupRegistry = ( registry ) => {
				registry.dispatch( MODULES_ADSENSE ).receiveGetSettings( {} );
				registry
					.dispatch( MODULES_ADSENSE )
					.receiveGetExistingTag( null );
				registry
					.dispatch( CORE_USER )
					.receiveIsAdBlockerActive( false );
				provideSiteInfo( registry, { webStoriesActive: true } );
				provideUserAuthentication( registry );
				provideModules( registry, [
					{
						slug: 'adsense',
						active: true,
						connected: true,
					},
				] );
				provideModuleRegistrations( registry );

				args?.setupRegistry?.( registry );
			};

			return (
				<WithRegistrySetup func={ setupRegistry }>
					<Story />
				</WithRegistrySetup>
			);
		},
	],
};
