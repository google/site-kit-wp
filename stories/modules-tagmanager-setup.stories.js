/**
 * Tag Manager Module Setup Stories.
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
import { WithTestRegistry, createTestRegistry, freezeFetch } from '../tests/js/utils';
import { fillFilterWithComponent } from '../assets/js/util';
import SetupWrapper from '../assets/js/components/setup/setup-wrapper';
import { STORE_NAME as CORE_SITE, AMP_MODE_PRIMARY, AMP_MODE_SECONDARY } from '../assets/js/googlesitekit/datastore/site/constants';
import { STORE_NAME as CORE_USER } from '../assets/js/googlesitekit/datastore/user';
import { SetupMain as TagManagerSetup } from '../assets/js/modules/tagmanager/components/setup';
import { STORE_NAME, ACCOUNT_CREATE } from '../assets/js/modules/tagmanager/datastore/constants';
import { STORE_NAME as MODULES_ANALYTICS } from '../assets/js/modules/analytics/datastore/constants';
import * as fixtures from '../assets/js/modules/tagmanager/datastore/__fixtures__';
import { STORE_NAME as CORE_MODULES } from '../assets/js/googlesitekit/modules/datastore/constants';
import * as modulesFixtures from '../assets/js/googlesitekit/modules/datastore/__fixtures__';
import { parseLiveContainerVersionIDs } from '../assets/js/modules/tagmanager/datastore/__factories__/utils';

function Setup( props ) {
	global._googlesitekitLegacyData.setup.moduleToSetup = 'tagmanager';

	removeAllFilters( 'googlesitekit.ModuleSetup-tagmanager' );
	addFilter(
		'googlesitekit.ModuleSetup-tagmanager',
		'googlesitekit.TagManagerModuleSetup',
		fillFilterWithComponent( TagManagerSetup )
	);

	return (
		<WithTestRegistry { ...props }>
			<SetupWrapper />
		</WithTestRegistry>
	);
}

storiesOf( 'Tag Manager Module/Setup', module )
	.addDecorator( ( storyFn ) => {
		const registry = createTestRegistry();
		registry.dispatch( STORE_NAME ).setSettings( {} );
		registry.dispatch( STORE_NAME ).receiveGetExistingTag( null );
		registry.dispatch( CORE_USER ).receiveGetAuthentication( {} );
		registry.dispatch( CORE_SITE ).receiveSiteInfo( { ampMode: false } );
		const activeModules = modulesFixtures.withActive( 'tagmanager' );
		registry.dispatch( CORE_MODULES ).receiveGetModules( activeModules );
		registry.dispatch( MODULES_ANALYTICS ).receiveGetSettings( { propertyID: '' } );

		return storyFn( registry );
	} )
	.add( 'Loading', ( registry ) => {
		freezeFetch( /^\/google-site-kit\/v1\/modules\/tagmanager\/data\/accounts/ );

		return <Setup registry={ registry } />;
	} )
	.add( 'Start', ( registry ) => {
		registry.dispatch( STORE_NAME ).setSettings( {} );
		registry.dispatch( STORE_NAME ).receiveGetAccounts( fixtures.accounts );
		// eslint-disable-next-line sitekit/camelcase-acronyms
		registry.dispatch( STORE_NAME ).receiveGetContainers( fixtures.getContainers.all, { accountID: fixtures.accounts[ 0 ].accountId } );

		return <Setup registry={ registry } />;
	} )
	.add( 'No accounts', ( registry ) => {
		registry.dispatch( STORE_NAME ).receiveGetAccounts( [] );

		return <Setup registry={ registry } />;
	} )
	.add( 'Set up a new account', ( registry ) => {
		registry.dispatch( STORE_NAME ).receiveGetAccounts( fixtures.accounts );
		registry.dispatch( STORE_NAME ).setAccountID( ACCOUNT_CREATE );

		return <Setup registry={ registry } />;
	} )
	.add( 'Existing tag (with access)', ( registry ) => {
		// eslint-disable-next-line sitekit/camelcase-acronyms
		const accountID = fixtures.accounts[ 0 ].accountId;
		registry.dispatch( STORE_NAME ).receiveGetExistingTag( 'GTM-S1T3K1T' );
		registry.dispatch( STORE_NAME ).receiveGetTagPermission( { accountID, permission: true }, { containerID: 'GTM-S1T3K1T' } );
		registry.dispatch( STORE_NAME ).receiveGetAccounts( fixtures.accounts );
		registry.dispatch( STORE_NAME ).receiveGetContainers( fixtures.getContainers.all, { accountID } );

		return <Setup registry={ registry } />;
	} )
	.add( 'Existing tag (no access)', ( registry ) => {
		registry.dispatch( STORE_NAME ).receiveGetExistingTag( 'GTM-GXXXGL3' );
		registry.dispatch( STORE_NAME ).receiveGetTagPermission( { accountID: '', permission: false }, { containerID: 'GTM-GXXXGL3' } );
		registry.dispatch( STORE_NAME ).receiveGetAccounts( fixtures.accounts );

		return <Setup registry={ registry } />;
	} )
	.add( 'Container with property ID, Analytics inactive', ( registry ) => {
		const webContainerVersion = fixtures.liveContainerVersions.web.gaWithVariable;
		const accountID = webContainerVersion.accountId; // eslint-disable-line sitekit/camelcase-acronyms
		registry.dispatch( STORE_NAME ).receiveGetAccounts( fixtures.accounts );
		registry.dispatch( STORE_NAME ).receiveGetContainers( [
			webContainerVersion.container,
		], { accountID } );
		parseLiveContainerVersionIDs( webContainerVersion, ( { internalContainerID } ) => {
			registry.dispatch( STORE_NAME ).receiveGetLiveContainerVersion( webContainerVersion, { accountID, internalContainerID } );
		} );

		return <Setup registry={ registry } />;
	} )
	// Multiple property IDs are only possible with secondary AMP.
	.add( 'Container with property ID, Analytics active, ID match', ( registry ) => {
		const webContainerVersion = fixtures.liveContainerVersions.web.gaWithVariable;
		const accountID = webContainerVersion.accountId; // eslint-disable-line sitekit/camelcase-acronyms
		registry.dispatch( STORE_NAME ).receiveGetAccounts( fixtures.accounts );
		registry.dispatch( STORE_NAME ).receiveGetContainers( [
			webContainerVersion.container,
		], { accountID } );
		parseLiveContainerVersionIDs( webContainerVersion, ( { internalContainerID } ) => {
			registry.dispatch( STORE_NAME ).receiveGetLiveContainerVersion( webContainerVersion, { accountID, internalContainerID } );
			const propertyID = registry.select( STORE_NAME ).getLiveContainerAnalyticsPropertyID( accountID, internalContainerID );
			registry.dispatch( MODULES_ANALYTICS ).setPropertyID( propertyID );
		} );
		const activeModules = modulesFixtures.withActive( 'tagmanager', 'analytics' );
		registry.dispatch( CORE_MODULES ).receiveGetModules( activeModules );

		return <Setup registry={ registry } />;
	} )
	.add( 'Container with property ID, Analytics active, ID mismatch error', ( registry ) => {
		const webContainerVersion = fixtures.liveContainerVersions.web.gaWithVariable;
		const accountID = webContainerVersion.accountId; // eslint-disable-line sitekit/camelcase-acronyms
		registry.dispatch( STORE_NAME ).receiveGetAccounts( fixtures.accounts );
		registry.dispatch( STORE_NAME ).receiveGetContainers( [
			webContainerVersion.container,
		], { accountID } );
		parseLiveContainerVersionIDs( webContainerVersion, ( { internalContainerID } ) => {
			registry.dispatch( STORE_NAME ).receiveGetLiveContainerVersion( webContainerVersion, { accountID, internalContainerID } );
		} );
		registry.dispatch( MODULES_ANALYTICS ).setPropertyID( 'UA-99999-9' );
		const activeModules = modulesFixtures.withActive( 'tagmanager', 'analytics' );
		registry.dispatch( CORE_MODULES ).receiveGetModules( activeModules );

		return <Setup registry={ registry } />;
	} )
;

storiesOf( 'Tag Manager Module/Setup/Primary AMP', module )
	.addDecorator( ( storyFn ) => {
		const registry = createTestRegistry();
		registry.dispatch( STORE_NAME ).setSettings( {} );
		registry.dispatch( STORE_NAME ).receiveGetExistingTag( null );
		registry.dispatch( CORE_SITE ).receiveSiteInfo( { ampMode: AMP_MODE_PRIMARY } );
		registry.dispatch( CORE_USER ).receiveGetAuthentication( {} );
		const activeModules = modulesFixtures.withActive( 'tagmanager' );
		registry.dispatch( CORE_MODULES ).receiveGetModules( activeModules );
		registry.dispatch( MODULES_ANALYTICS ).receiveGetSettings( { propertyID: '' } );

		return storyFn( registry );
	} )
	.add( 'Start', ( registry ) => {
		registry.dispatch( STORE_NAME ).receiveGetAccounts( fixtures.accounts );
		// eslint-disable-next-line sitekit/camelcase-acronyms
		registry.dispatch( STORE_NAME ).receiveGetContainers( fixtures.getContainers.all, { accountID: fixtures.accounts[ 0 ].accountId } );

		return <Setup registry={ registry } />;
	} )
	.add( 'Selected', ( registry ) => {
		// eslint-disable-next-line sitekit/camelcase-acronyms
		const accountID = fixtures.accounts[ 0 ].accountId;
		registry.dispatch( STORE_NAME ).setAccountID( accountID );
		registry.dispatch( STORE_NAME ).receiveGetAccounts( fixtures.accounts );
		registry.dispatch( STORE_NAME ).receiveGetContainers( fixtures.getContainers.all, { accountID } );
		const [ container ] = registry.select( STORE_NAME ).getAMPContainers( accountID );
		// eslint-disable-next-line sitekit/camelcase-acronyms
		registry.dispatch( STORE_NAME ).setAMPContainerID( container.publicId );
		// eslint-disable-next-line sitekit/camelcase-acronyms
		registry.dispatch( STORE_NAME ).setInternalAMPContainerID( container.containerId );

		return <Setup registry={ registry } />;
	} )
	.add( 'Container with property ID, Analytics inactive', ( registry ) => {
		const ampContainerVersion = fixtures.liveContainerVersions.amp.ga;
		const accountID = ampContainerVersion.accountId; // eslint-disable-line sitekit/camelcase-acronyms
		registry.dispatch( STORE_NAME ).receiveGetAccounts( fixtures.accounts );
		registry.dispatch( STORE_NAME ).receiveGetContainers( [
			ampContainerVersion.container,
		], { accountID } );
		parseLiveContainerVersionIDs( ampContainerVersion, ( { internalContainerID } ) => {
			registry.dispatch( STORE_NAME ).receiveGetLiveContainerVersion( ampContainerVersion, { accountID, internalContainerID } );
		} );

		return <Setup registry={ registry } />;
	} )
	// Multiple property IDs are only possible with secondary AMP.
	.add( 'Container with property ID, Analytics active, ID match', ( registry ) => {
		const ampContainerVersion = fixtures.liveContainerVersions.amp.ga;
		const accountID = ampContainerVersion.accountId; // eslint-disable-line sitekit/camelcase-acronyms
		registry.dispatch( STORE_NAME ).receiveGetAccounts( fixtures.accounts );
		registry.dispatch( STORE_NAME ).receiveGetContainers( [
			ampContainerVersion.container,
		], { accountID } );
		parseLiveContainerVersionIDs( ampContainerVersion, ( { internalContainerID } ) => {
			registry.dispatch( STORE_NAME ).receiveGetLiveContainerVersion( ampContainerVersion, { accountID, internalContainerID } );
			const propertyID = registry.select( STORE_NAME ).getLiveContainerAnalyticsPropertyID( accountID, internalContainerID );
			registry.dispatch( MODULES_ANALYTICS ).setPropertyID( propertyID );
		} );
		const activeModules = modulesFixtures.withActive( 'tagmanager', 'analytics' );
		registry.dispatch( CORE_MODULES ).receiveGetModules( activeModules );

		return <Setup registry={ registry } />;
	} )
	.add( 'Container with property ID, Analytics active, ID mismatch error', ( registry ) => {
		const ampContainerVersion = fixtures.liveContainerVersions.amp.ga;
		const accountID = ampContainerVersion.accountId; // eslint-disable-line sitekit/camelcase-acronyms
		registry.dispatch( STORE_NAME ).receiveGetAccounts( fixtures.accounts );
		registry.dispatch( STORE_NAME ).receiveGetContainers( [
			ampContainerVersion.container,
		], { accountID } );
		parseLiveContainerVersionIDs( ampContainerVersion, ( { internalContainerID } ) => {
			registry.dispatch( STORE_NAME ).receiveGetLiveContainerVersion( ampContainerVersion, { accountID, internalContainerID } );
		} );
		registry.dispatch( MODULES_ANALYTICS ).setPropertyID( 'UA-99999-9' );
		const activeModules = modulesFixtures.withActive( 'tagmanager', 'analytics' );
		registry.dispatch( CORE_MODULES ).receiveGetModules( activeModules );

		return <Setup registry={ registry } />;
	} )
;

storiesOf( 'Tag Manager Module/Setup/Secondary AMP', module )
	.addDecorator( ( storyFn ) => {
		const registry = createTestRegistry();
		registry.dispatch( STORE_NAME ).setSettings( {} );
		registry.dispatch( STORE_NAME ).receiveGetExistingTag( null );
		registry.dispatch( CORE_SITE ).receiveSiteInfo( { ampMode: AMP_MODE_SECONDARY } );
		registry.dispatch( CORE_USER ).receiveGetAuthentication( {} );
		const activeModules = modulesFixtures.withActive( 'tagmanager' );
		registry.dispatch( CORE_MODULES ).receiveGetModules( activeModules );
		registry.dispatch( MODULES_ANALYTICS ).receiveGetSettings( { propertyID: '' } );

		return storyFn( registry );
	} )
	.add( 'Start', ( registry ) => {
		registry.dispatch( STORE_NAME ).receiveGetAccounts( fixtures.accounts );
		// eslint-disable-next-line sitekit/camelcase-acronyms
		registry.dispatch( STORE_NAME ).receiveGetContainers( fixtures.getContainers.all, { accountID: fixtures.accounts[ 0 ].accountId } );

		return <Setup registry={ registry } />;
	} )
	.add( 'Selected', ( registry ) => {
		// eslint-disable-next-line sitekit/camelcase-acronyms
		const accountID = fixtures.accounts[ 0 ].accountId;
		registry.dispatch( STORE_NAME ).setAccountID( accountID );
		registry.dispatch( STORE_NAME ).receiveGetAccounts( fixtures.accounts );
		registry.dispatch( STORE_NAME ).receiveGetContainers( fixtures.getContainers.all, { accountID } );
		const [ webContainer ] = registry.select( STORE_NAME ).getWebContainers( accountID );
		// eslint-disable-next-line sitekit/camelcase-acronyms
		registry.dispatch( STORE_NAME ).setContainerID( webContainer.publicId );
		// eslint-disable-next-line sitekit/camelcase-acronyms
		registry.dispatch( STORE_NAME ).setInternalContainerID( webContainer.containerId );
		const [ ampContainer ] = registry.select( STORE_NAME ).getAMPContainers( accountID );
		// eslint-disable-next-line sitekit/camelcase-acronyms
		registry.dispatch( STORE_NAME ).setAMPContainerID( ampContainer.publicId );
		// eslint-disable-next-line sitekit/camelcase-acronyms
		registry.dispatch( STORE_NAME ).setInternalAMPContainerID( ampContainer.containerId );

		return <Setup registry={ registry } />;
	} )
	.add( 'Singular property ID, Analytics inactive', ( registry ) => {
		const webContainerVersion = fixtures.liveContainerVersions.web.gaWithVariable;
		const ampContainerVersion = fixtures.liveContainerVersions.amp.ga;
		const accountID = webContainerVersion.accountId; // eslint-disable-line sitekit/camelcase-acronyms
		registry.dispatch( STORE_NAME ).receiveGetAccounts( fixtures.accounts );
		registry.dispatch( STORE_NAME ).receiveGetContainers( [
			webContainerVersion.container,
			ampContainerVersion.container,
		], { accountID } );
		parseLiveContainerVersionIDs( webContainerVersion, ( { internalContainerID } ) => {
			registry.dispatch( STORE_NAME ).receiveGetLiveContainerVersion( webContainerVersion, { accountID, internalContainerID } );
		} );
		parseLiveContainerVersionIDs( ampContainerVersion, ( { internalContainerID } ) => {
			registry.dispatch( STORE_NAME ).receiveGetLiveContainerVersion( ampContainerVersion, { accountID, internalContainerID } );
		} );

		return <Setup registry={ registry } />;
	} )
	.add( 'Multiple property IDs, Analytics inactive', ( registry ) => {
		const webContainerVersion = fixtures.liveContainerVersions.web.gaWithVariable;
		const ampContainerVersion = fixtures.liveContainerVersions.amp.noGA;
		const accountID = webContainerVersion.accountId; // eslint-disable-line sitekit/camelcase-acronyms
		registry.dispatch( STORE_NAME ).receiveGetAccounts( fixtures.accounts );
		registry.dispatch( STORE_NAME ).receiveGetContainers( [
			webContainerVersion.container,
			ampContainerVersion.container,
		], { accountID } );
		parseLiveContainerVersionIDs( webContainerVersion, ( { internalContainerID } ) => {
			registry.dispatch( STORE_NAME ).receiveGetLiveContainerVersion( webContainerVersion, { accountID, internalContainerID } );
		} );
		parseLiveContainerVersionIDs( ampContainerVersion, ( { internalContainerID } ) => {
			registry.dispatch( STORE_NAME ).receiveGetLiveContainerVersion( ampContainerVersion, { accountID, internalContainerID } );
		} );

		return <Setup registry={ registry } />;
	} )
	.add( 'Multiple property IDs, Analytics active', ( registry ) => {
		const webContainerVersion = fixtures.liveContainerVersions.web.gaWithVariable;
		const ampContainerVersion = fixtures.liveContainerVersions.amp.noGA;
		const accountID = webContainerVersion.accountId; // eslint-disable-line sitekit/camelcase-acronyms
		registry.dispatch( STORE_NAME ).receiveGetAccounts( fixtures.accounts );
		registry.dispatch( STORE_NAME ).receiveGetContainers( [
			webContainerVersion.container,
			ampContainerVersion.container,
		], { accountID } );
		parseLiveContainerVersionIDs( webContainerVersion, ( { internalContainerID } ) => {
			registry.dispatch( STORE_NAME ).receiveGetLiveContainerVersion( webContainerVersion, { accountID, internalContainerID } );
		} );
		parseLiveContainerVersionIDs( ampContainerVersion, ( { internalContainerID } ) => {
			registry.dispatch( STORE_NAME ).receiveGetLiveContainerVersion( ampContainerVersion, { accountID, internalContainerID } );
		} );
		const activeModules = modulesFixtures.withActive( 'tagmanager', 'analytics' );
		registry.dispatch( CORE_MODULES ).receiveGetModules( activeModules );

		return <Setup registry={ registry } />;
	} )
	.add( 'Singular property ID, Analytics active, ID match', ( registry ) => {
		const webContainerVersion = fixtures.liveContainerVersions.web.gaWithVariable;
		const ampContainerVersion = fixtures.liveContainerVersions.amp.ga;
		const accountID = ampContainerVersion.accountId; // eslint-disable-line sitekit/camelcase-acronyms
		registry.dispatch( STORE_NAME ).receiveGetAccounts( fixtures.accounts );
		registry.dispatch( STORE_NAME ).receiveGetContainers( [
			webContainerVersion.container,
			ampContainerVersion.container,
		], { accountID } );
		parseLiveContainerVersionIDs( webContainerVersion, ( { internalContainerID } ) => {
			registry.dispatch( STORE_NAME ).receiveGetLiveContainerVersion( webContainerVersion, { accountID, internalContainerID } );
			const propertyID = registry.select( STORE_NAME ).getLiveContainerAnalyticsPropertyID( accountID, internalContainerID );
			registry.dispatch( MODULES_ANALYTICS ).setPropertyID( propertyID );
		} );
		parseLiveContainerVersionIDs( ampContainerVersion, ( { internalContainerID } ) => {
			registry.dispatch( STORE_NAME ).receiveGetLiveContainerVersion( ampContainerVersion, { accountID, internalContainerID } );
		} );
		const activeModules = modulesFixtures.withActive( 'tagmanager', 'analytics' );
		registry.dispatch( CORE_MODULES ).receiveGetModules( activeModules );

		return <Setup registry={ registry } />;
	} )
	.add( 'Singular property ID, Analytics active, ID mismatch error', ( registry ) => {
		const webContainerVersion = fixtures.liveContainerVersions.web.gaWithVariable;
		const ampContainerVersion = fixtures.liveContainerVersions.amp.ga;
		const accountID = ampContainerVersion.accountId; // eslint-disable-line sitekit/camelcase-acronyms
		registry.dispatch( STORE_NAME ).receiveGetAccounts( fixtures.accounts );
		registry.dispatch( STORE_NAME ).receiveGetContainers( [
			webContainerVersion.container,
			ampContainerVersion.container,
		], { accountID } );
		parseLiveContainerVersionIDs( webContainerVersion, ( { internalContainerID } ) => {
			registry.dispatch( STORE_NAME ).receiveGetLiveContainerVersion( webContainerVersion, { accountID, internalContainerID } );
		} );
		parseLiveContainerVersionIDs( ampContainerVersion, ( { internalContainerID } ) => {
			registry.dispatch( STORE_NAME ).receiveGetLiveContainerVersion( ampContainerVersion, { accountID, internalContainerID } );
		} );
		registry.dispatch( MODULES_ANALYTICS ).setPropertyID( 'UA-99999-9' );
		const activeModules = modulesFixtures.withActive( 'tagmanager', 'analytics' );
		registry.dispatch( CORE_MODULES ).receiveGetModules( activeModules );

		return <Setup registry={ registry } />;
	} )
;
