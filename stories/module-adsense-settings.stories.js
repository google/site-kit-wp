/**
 * AdSense Settings stories.
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
import * as fixtures from '../assets/js/modules/adsense/datastore/__fixtures__';
import { MODULES_ADSENSE } from '../assets/js/modules/adsense/datastore/constants';
import {
	ACCOUNT_STATUS_PENDING,
	ACCOUNT_STATUS_APPROVED,
	SITE_STATUS_ADDED,
} from '../assets/js/modules/adsense/util/status';
import {
	createTestRegistry,
	provideUserAuthentication,
	provideModules,
	provideModuleRegistrations,
	provideSiteInfo,
} from '../tests/js/utils';
import createLegacySettingsWrapper from './utils/create-legacy-settings-wrapper';

const defaultSettings = {
	accountID: '',
	adBlockingRecoverySetupStatus: '',
	clientID: '',
	accountStatus: '',
	siteStatus: '',
	useSnippet: true,
	accountSetupComplete: false,
	siteSetupComplete: false,
	ownerID: 0,
};

const completeSettings = {
	...defaultSettings,
	accountID: fixtures.accounts[ 0 ]._id,
	adBlockingRecoverySetupStatus: '',
	clientID: fixtures.clients[ 0 ]._id,
	accountStatus: ACCOUNT_STATUS_APPROVED,
	siteStatus: SITE_STATUS_ADDED,
	accountSetupComplete: true,
	siteSetupComplete: true,
	webStoriesAdUnit: '0123456789',
	webStoriesActive: true,
};

const Settings = createLegacySettingsWrapper( 'adsense' );

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

const withRegistry = ( Story ) => {
	const registry = createTestRegistry();
	registry.dispatch( MODULES_ADSENSE ).receiveGetSettings( {} );
	registry.dispatch( MODULES_ADSENSE ).receiveGetExistingTag( null );
	registry.dispatch( MODULES_ADSENSE ).receiveIsAdBlockerActive( false );
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

	return <Story registry={ registry } />;
};

storiesOf( 'AdSense Module/Settings', module )
	.add(
		'View, closed',
		( args, { registry } ) => {
			return (
				<Settings registry={ registry } route="/connected-services" />
			);
		},
		{
			decorators: [ withRegistry ],
		}
	)
	.add(
		'View, open with setup incomplete',
		( args, { registry } ) => {
			registry.dispatch( MODULES_ADSENSE ).receiveGetSettings( {
				...completeSettings,
				accountStatus: ACCOUNT_STATUS_PENDING,
				accountSetupComplete: false,
				siteSetupComplete: false,
			} );

			return (
				<Settings
					route="/connected-services/adsense"
					registry={ registry }
				/>
			);
		},
		{
			decorators: [ withRegistry ],
		}
	)
	.add(
		'View, open with all settings',
		( args, { registry } ) => {
			registry
				.dispatch( MODULES_ADSENSE )
				.receiveGetSettings( completeSettings );

			return (
				<Settings
					route="/connected-services/adsense"
					registry={ registry }
				/>
			);
		},
		{
			decorators: [ withRegistry ],
		}
	)
	.add(
		'View, open with Ad Blocking Recovery tag placed',
		( args, { registry } ) => {
			registry.dispatch( MODULES_ADSENSE ).receiveGetSettings( {
				...completeSettings,
				adBlockingRecoverySetupStatus: 'tag-placed',
				useAdBlockingRecoverySnippet: true,
			} );

			return (
				<Settings
					route="/connected-services/adsense"
					registry={ registry }
				/>
			);
		},
		{
			decorators: [ withRegistry ],
		}
	)
	.add(
		'View, open with Ad Blocking Recovery tag not placed',
		( args, { registry } ) => {
			registry.dispatch( MODULES_ADSENSE ).receiveGetSettings( {
				...completeSettings,
				adBlockingRecoverySetupStatus: 'setup-confirmed',
				useAdBlockingRecoverySnippet: false,
			} );

			return (
				<Settings
					route="/connected-services/adsense"
					registry={ registry }
				/>
			);
		},
		{
			decorators: [ withRegistry ],
		}
	)
	.add(
		'Edit, open',
		( args, { registry } ) => {
			registry
				.dispatch( MODULES_ADSENSE )
				.receiveGetSettings( completeSettings );
			setUpAdUnits( registry );

			return (
				<Settings
					route="/connected-services/adsense/edit"
					registry={ registry }
				/>
			);
		},
		{
			decorators: [ withRegistry ],
		}
	)
	.add(
		'Edit, open with existing tag (same account)',
		( args, { registry } ) => {
			registry
				.dispatch( MODULES_ADSENSE )
				.receiveGetSettings( completeSettings );
			registry
				.dispatch( MODULES_ADSENSE )
				.receiveGetExistingTag( completeSettings.clientID );
			setUpAdUnits( registry );

			return (
				<Settings
					route="/connected-services/adsense/edit"
					registry={ registry }
				/>
			);
		},
		{
			decorators: [ withRegistry ],
		}
	)
	.add(
		'Edit, open with existing tag (different account)',
		( args, { registry } ) => {
			registry
				.dispatch( MODULES_ADSENSE )
				.receiveGetSettings( completeSettings );
			registry
				.dispatch( MODULES_ADSENSE )
				.receiveGetExistingTag( 'ca-pub-12345678' );
			setUpAdUnits( registry );

			return (
				<Settings
					route="/connected-services/adsense/edit"
					registry={ registry }
				/>
			);
		},
		{
			decorators: [ withRegistry ],
		}
	)
	.add(
		'Edit, open with existing ad blocking recovery tag (same account)',
		( args, { registry } ) => {
			registry
				.dispatch( MODULES_ADSENSE )
				.receiveGetSettings( completeSettings );
			registry
				.dispatch( MODULES_ADSENSE )
				.receiveGetExistingAdBlockingRecoveryTag(
					completeSettings.accountID
				);
			setUpAdUnits( registry );

			return (
				<Settings
					route="/connected-services/adsense/edit"
					registry={ registry }
				/>
			);
		},
		{
			decorators: [ withRegistry ],
		}
	)
	.add(
		'Edit, open with existing ad blocking recovery tag (different account)',
		( args, { registry } ) => {
			registry
				.dispatch( MODULES_ADSENSE )
				.receiveGetSettings( completeSettings );
			registry
				.dispatch( MODULES_ADSENSE )
				.receiveGetExistingAdBlockingRecoveryTag( 'pub-12345678' );
			setUpAdUnits( registry );

			return (
				<Settings
					route="/connected-services/adsense/edit"
					registry={ registry }
				/>
			);
		},
		{
			decorators: [ withRegistry ],
		}
	);
