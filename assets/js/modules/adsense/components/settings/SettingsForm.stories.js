/**
 * AdSense SettingsForm component stories.
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
import SettingsForm from './SettingsForm';
import { Cell, Grid, Row } from '../../../../material-components';
import { MODULES_ADSENSE } from '../../datastore/constants';
import { CORE_USER } from '../../../../googlesitekit/datastore/user/constants';
import {
	provideModuleRegistrations,
	provideModules,
	provideSiteInfo,
	provideUserAuthentication,
} from '../../../../../../tests/js/utils';
import WithRegistrySetup from '../../../../../../tests/js/WithRegistrySetup';
import { ACCOUNT_STATUS_APPROVED, SITE_STATUS_ADDED } from '../../util';

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

const setUpAdUnits = ( registry ) => {
	const accountID = fixtures.accounts[ 0 ]._id;
	const clientID = fixtures.clients[ 0 ]._id;
	registry
		.dispatch( MODULES_ADSENSE )
		.receiveGetAdUnits( fixtures.adunits, { accountID, clientID } );
	registry
		.dispatch( MODULES_ADSENSE )
		.finishResolution( 'getAdUnits', [ accountID, clientID ] );
};

function Template( args ) {
	return (
		<div className="googlesitekit-layout">
			<div className="googlesitekit-settings-module googlesitekit-settings-module--active googlesitekit-settings-module--adsense">
				<div className="googlesitekit-setup-module">
					<div className="googlesitekit-settings-module__content googlesitekit-settings-module__content--open">
						<Grid>
							<Row>
								<Cell size={ 12 }>
									<SettingsForm { ...args } />
								</Cell>
							</Row>
						</Grid>
					</div>
				</div>
			</div>
		</div>
	);
}

export const Default = Template.bind( {} );
Default.storyName = 'Default';
Default.args = {
	setupRegistry: ( registry ) => {
		registry
			.dispatch( MODULES_ADSENSE )
			.receiveGetSettings( adSenseSettings );
		setUpAdUnits( registry );
	},
};

export const ExistingTagSameAccount = Template.bind( {} );
ExistingTagSameAccount.storyName = 'Existing Tag (Same Account)';
ExistingTagSameAccount.args = {
	setupRegistry: ( registry ) => {
		registry
			.dispatch( MODULES_ADSENSE )
			.receiveGetSettings( adSenseSettings );
		registry
			.dispatch( MODULES_ADSENSE )
			.receiveGetExistingTag( adSenseSettings.clientID );
		setUpAdUnits( registry );
	},
};

export const ExistingTagDifferentAccount = Template.bind( {} );
ExistingTagDifferentAccount.storyName = 'Existing Tag (Different Account)';
ExistingTagDifferentAccount.args = {
	setupRegistry: ( registry ) => {
		registry
			.dispatch( MODULES_ADSENSE )
			.receiveGetSettings( adSenseSettings );
		registry
			.dispatch( MODULES_ADSENSE )
			.receiveGetExistingTag( 'ca-pub-12345678' );
		setUpAdUnits( registry );
	},
};

export const ExistingAdBlockingRecoveryTagSameAccount = Template.bind( {} );
ExistingAdBlockingRecoveryTagSameAccount.storyName =
	'Existing Ad Blocking Recovery Tag (Same Account)';
ExistingAdBlockingRecoveryTagSameAccount.args = {
	setupRegistry: ( registry ) => {
		registry
			.dispatch( MODULES_ADSENSE )
			.receiveGetSettings( adSenseSettings );
		registry
			.dispatch( MODULES_ADSENSE )
			.receiveGetExistingAdBlockingRecoveryTag(
				adSenseSettings.accountID
			);
		registry
			.dispatch( MODULES_ADSENSE )
			.setAdBlockingRecoverySetupStatus( 'setup-confirmed' );
		setUpAdUnits( registry );
	},
};

export const ExistingAdBlockingRecoveryTagDifferentAccount = Template.bind(
	{}
);
ExistingAdBlockingRecoveryTagDifferentAccount.storyName =
	'Existing Ad Blocking Recovery Tag (Different Account)';
ExistingAdBlockingRecoveryTagDifferentAccount.args = {
	setupRegistry: ( registry ) => {
		registry
			.dispatch( MODULES_ADSENSE )
			.receiveGetSettings( adSenseSettings );
		registry
			.dispatch( MODULES_ADSENSE )
			.receiveGetExistingAdBlockingRecoveryTag( 'pub-12345678' );
		registry
			.dispatch( MODULES_ADSENSE )
			.setAdBlockingRecoverySetupStatus( 'setup-confirmed' );
		setUpAdUnits( registry );
	},
};

export default {
	title: 'Modules/AdSense/Settings/SettingsForm',
	component: SettingsForm,
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
