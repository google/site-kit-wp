/**
 * Analytics Settings stories.
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
import * as fixtures from '../assets/js/modules/analytics/datastore/__fixtures__';
import { STORE_NAME, PROFILE_CREATE } from '../assets/js/modules/analytics/datastore/constants';
import { MODULES_ANALYTICS_4 } from '../assets/js/modules/analytics-4/datastore/constants';
import { createTestRegistry, provideModules, provideModuleRegistrations } from '../tests/js/utils';
import { generateGTMAnalyticsPropertyStory } from './utils/generate-gtm-analytics-property-story';
import createLegacySettingsWrapper from './utils/create-legacy-settings-wrapper';
import defaultSettings from '../assets/js/modules/analytics/datastore/__fixtures__/settings--default.json';
import { enabledFeatures } from '../assets/js/features';

const Settings = createLegacySettingsWrapper( 'analytics' );

function usingGenerateGTMAnalyticsPropertyStory( args ) {
	return generateGTMAnalyticsPropertyStory( {
		...args,
		Component( { callback, registry } ) {
			return (
				<Settings
					callback={ callback }
					registry={ registry }
					route="/connected-services/analytics/edit"
				/>
			);
		},
	} );
}

const withRegistry = ( Story ) => {
	const registry = createTestRegistry();
	registry.dispatch( STORE_NAME ).receiveGetSettings( {} );
	registry.dispatch( STORE_NAME ).receiveGetExistingTag( null );
	provideModules( registry, [ {
		slug: 'analytics',
		active: true,
		connected: true,
	} ] );
	provideModuleRegistrations( registry );

	return (
		<Story registry={ registry } />
	);
};

storiesOf( 'Analytics Module/Settings', module )
	.add( 'View, closed', ( args, { registry } ) => {
		return <Settings registry={ registry } route="/connected-services" />;
	}, {
		decorators: [
			withRegistry,
		],
	} )
	.add( 'View, open with all settings', ( args, { registry } ) => {
		registry.dispatch( STORE_NAME ).receiveGetSettings( {
			...defaultSettings,
			accountID: '1234567890',
			propertyID: 'UA-1234567890-1',
			internalWebPropertyID: '135791113',
			profileID: '9999999',
		} );

		return <Settings registry={ registry } route="/connected-services/analytics" />;
	}, {
		decorators: [
			withRegistry,
		],
	} )
	.add( 'View, open with all settings + GA4', ( args, { registry } ) => {
		provideModules( registry, [
			{
				slug: 'search-console',
				active: false,
				connected: true,
			},
			{
				slug: 'analytics',
				active: true,
				connected: true,
			},
			{
				slug: 'analytics-4',
				active: true,
				connected: true,
				internal: true,
			},
		] );

		registry.dispatch( STORE_NAME ).receiveGetSettings( {
			...defaultSettings,
			accountID: '1234567890',
			propertyID: 'UA-1234567890-1',
			internalWebPropertyID: '135791113',
			profileID: '9999999',
		} );

		registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetSettings( {
			propertyID: '1001',
			webDataStreamID: '2001',
			measurementID: 'G-12345ABCDE',
		} );

		return (
			<Settings
				registry={ registry }
				features={ [ 'ga4setup' ] }
				route="/connected-services/analytics"
				skipModulesProvide
			/>
		);
	}, {
		decorators: [
			withRegistry,
		],
	} )
	.add( 'View, open with all settings, no snippet with existing tag', ( args, { registry } ) => {
		registry.dispatch( STORE_NAME ).receiveGetSettings( {
			...defaultSettings,
			accountID: '1234567890',
			propertyID: 'UA-1234567890-1',
			internalWebPropertyID: '135791113',
			profileID: '9999999',
			useSnippet: false,
		} );
		registry.dispatch( STORE_NAME ).receiveGetExistingTag( 'UA-1234567890-1' );
		registry.dispatch( STORE_NAME ).receiveGetTagPermission( {
			accountID: '1234567890',
			permission: true,
		}, { propertyID: 'UA-1234567890-1' } );

		return <Settings registry={ registry } route="/connected-services/analytics" />;
	}, {
		decorators: [
			withRegistry,
		],
	} )
	.add( 'Edit, open with all settings', ( args, { registry } ) => {
		const { accounts, properties, profiles } = fixtures.accountsPropertiesProfiles;
		// eslint-disable-next-line sitekit/acronym-case
		const { accountId, webPropertyId, id: profileID } = profiles[ 0 ];
		// eslint-disable-next-line sitekit/acronym-case
		const { internalWebPropertyId } = properties.find( ( property ) => webPropertyId === property.id );

		registry.dispatch( STORE_NAME ).receiveGetAccounts( accounts );
		registry.dispatch( STORE_NAME ).receiveGetProperties( properties, { accountID: properties[ 0 ].accountId } ); // eslint-disable-line sitekit/acronym-case
		registry.dispatch( STORE_NAME ).receiveGetProfiles( profiles, {
			accountID: properties[ 0 ].accountId, // eslint-disable-line sitekit/acronym-case
			propertyID: profiles[ 0 ].webPropertyId, // eslint-disable-line sitekit/acronym-case
		} );
		registry.dispatch( STORE_NAME ).receiveGetSettings( {
			...defaultSettings,
			accountID: accountId, // eslint-disable-line sitekit/acronym-case
			propertyID: webPropertyId, // eslint-disable-line sitekit/acronym-case
			internalWebPropertyID: internalWebPropertyId, // eslint-disable-line sitekit/acronym-case
			profileID,
		} );

		return <Settings registry={ registry } route="/connected-services/analytics/edit" />;
	}, {
		decorators: [
			withRegistry,
		],
	} )
	.add( 'Edit, open with all settings + GA4', ( args, { registry } ) => {
		enabledFeatures.add( 'ga4setup' );

		const { accounts, properties, profiles } = fixtures.accountsPropertiesProfiles;
		// eslint-disable-next-line sitekit/acronym-case
		const { accountId: accountID, webPropertyId, id: profileID } = profiles[ 0 ];
		// eslint-disable-next-line sitekit/acronym-case
		const { internalWebPropertyId } = properties.find( ( property ) => webPropertyId === property.id );

		provideModules( registry, [
			{
				slug: 'search-console',
				active: false,
				connected: true,
			},
			{
				slug: 'analytics',
				active: true,
				connected: true,
			},
			{
				slug: 'analytics-4',
				active: true,
				connected: true,
				internal: true,
			},
		] );

		registry.dispatch( STORE_NAME ).receiveGetAccounts( accounts );
		registry.dispatch( STORE_NAME ).receiveGetProperties( properties, { accountID } );
		registry.dispatch( STORE_NAME ).receiveGetProfiles( profiles, {
			accountID,
			propertyID: profiles[ 0 ].webPropertyId, // eslint-disable-line sitekit/acronym-case
		} );

		registry.dispatch( STORE_NAME ).receiveGetSettings( {
			...defaultSettings,
			accountID,
			propertyID: webPropertyId, // eslint-disable-line sitekit/acronym-case
			internalWebPropertyID: internalWebPropertyId, // eslint-disable-line sitekit/acronym-case
			profileID,
		} );

		registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetSettings( {
			propertyID: '1001',
			webDataStreamID: '2001',
			measurementID: 'G-12345ABCDE',
		} );

		registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetProperties( [
			{
				_id: '1001',
				displayName: 'GA4 Property',
			},
		], { accountID } );

		registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetWebDataStreams( [
			{
				_id: '2001',
				/* eslint-disable sitekit/acronym-case */
				measurementId: 'G-12345ABCDE',
				defaultUri: 'http://example.com',
				/* eslint-disable */
			},
		], { propertyID: '1001' } );

		return (
			<Settings
				registry={ registry }
				features={ [ 'ga4setup' ] }
				route="/connected-services/analytics/edit"
				skipModulesProvide
			/>
		);
	}, {
		decorators: [
			withRegistry,
		],
	} )
	.add( 'Edit, open with all settings + GA4 new property', ( args, { registry } ) => {
		enabledFeatures.add( 'ga4setup' );

		const { accounts, properties, profiles } = fixtures.accountsPropertiesProfiles;
		// eslint-disable-next-line sitekit/acronym-case
		const { accountId: accountID, webPropertyId, id: profileID } = profiles[ 0 ];
		// eslint-disable-next-line sitekit/acronym-case
		const { internalWebPropertyId } = properties.find( ( property ) => webPropertyId === property.id );

		provideModules( registry, [
			{
				slug: 'search-console',
				active: false,
				connected: true,
			},
			{
				slug: 'analytics',
				active: true,
				connected: true,
			},
			{
				slug: 'analytics-4',
				active: true,
				connected: true,
				internal: true,
			},
		] );

		registry.dispatch( STORE_NAME ).receiveGetAccounts( accounts );
		registry.dispatch( STORE_NAME ).receiveGetProperties( properties, { accountID } );
		registry.dispatch( STORE_NAME ).receiveGetProfiles( profiles, {
			accountID,
			propertyID: profiles[ 0 ].webPropertyId, // eslint-disable-line sitekit/acronym-case
		} );

		registry.dispatch( STORE_NAME ).receiveGetSettings( {
			...defaultSettings,
			accountID,
			propertyID: webPropertyId, // eslint-disable-line sitekit/acronym-case
			internalWebPropertyID: internalWebPropertyId, // eslint-disable-line sitekit/acronym-case
			profileID,
		} );

		registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetSettings( {
			propertyID: '1001',
			webDataStreamID: '2001',
			measurementID: 'G-12345ABCDE',
		} );

		registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetProperties( [], { accountID } );

		return (
			<Settings
				registry={ registry }
				features={ [ 'ga4setup' ] }
				route="/connected-services/analytics/edit"
				skipModulesProvide
			/>
		);
	}, {
		decorators: [
			withRegistry,
		],
	} )
	.add( 'Edit, open when creating new view', ( args, { registry } ) => {
		const { accounts, properties, profiles } = fixtures.accountsPropertiesProfiles;
		// eslint-disable-next-line sitekit/acronym-case
		const { accountId, webPropertyId, id: profileID } = profiles[ 0 ];
		// eslint-disable-next-line sitekit/acronym-case
		const { internalWebPropertyId } = properties.find( ( property ) => webPropertyId === property.id );

		registry.dispatch( STORE_NAME ).receiveGetAccounts( accounts );
		registry.dispatch( STORE_NAME ).receiveGetProperties( properties, { accountID: accountId } ); // eslint-disable-line sitekit/acronym-case
		registry.dispatch( STORE_NAME ).receiveGetProfiles( profiles, {
			accountID: accountId, // eslint-disable-line sitekit/acronym-case
			propertyID: webPropertyId, // eslint-disable-line sitekit/acronym-case
		} );
		registry.dispatch( STORE_NAME ).receiveGetSettings( {
			...defaultSettings,
			accountID: accountId, // eslint-disable-line sitekit/acronym-case
			propertyID: webPropertyId, // eslint-disable-line sitekit/acronym-case
			internalWebPropertyID: internalWebPropertyId, // eslint-disable-line sitekit/acronym-case
			profileID,
		} );
		// This is chosen by the user, not received from API.
		registry.dispatch( STORE_NAME ).setSettings( {
			profileID: PROFILE_CREATE,
		} );

		return <Settings registry={ registry } route="/connected-services/analytics/edit" />;
	}, {
		decorators: [
			withRegistry,
		],
	} )
	.add( 'Edit, open with no accounts', ( args, { registry } ) => {
		registry.dispatch( STORE_NAME ).receiveGetAccounts( [] );
		registry.dispatch( STORE_NAME ).receiveGetSettings( defaultSettings );

		return <Settings registry={ registry } route="/connected-services/analytics/edit" />;
	}, {
		decorators: [
			withRegistry,
		],
	} )
	.add( 'Edit, with existing tag w/ access', ( args, { registry } ) => {
		const { accounts, properties, profiles, matchedProperty } = fixtures.accountsPropertiesProfiles;
		const existingTag = {
			// eslint-disable-next-line sitekit/acronym-case
			accountID: matchedProperty.accountId,
			propertyID: matchedProperty.id,
		};

		registry.dispatch( STORE_NAME ).receiveGetAccounts( accounts );
		registry.dispatch( STORE_NAME ).receiveGetProperties( properties, { accountID: properties[ 0 ].accountId } ); // eslint-disable-line sitekit/acronym-case
		registry.dispatch( STORE_NAME ).receiveGetProfiles( profiles, {
			accountID: properties[ 0 ].accountId, // eslint-disable-line sitekit/acronym-case
			propertyID: profiles[ 0 ].webPropertyId, // eslint-disable-line sitekit/acronym-case
		} );
		registry.dispatch( STORE_NAME ).receiveGetSettings( defaultSettings );
		registry.dispatch( STORE_NAME ).receiveGetExistingTag( existingTag.propertyID );
		registry.dispatch( STORE_NAME ).receiveGetTagPermission( {
			accountID: existingTag.accountID,
			permission: true,
		}, { propertyID: existingTag.propertyID } );

		return <Settings registry={ registry } route="/connected-services/analytics/edit" />;
	}, {
		decorators: [
			withRegistry,
		],
	} )
	.add( 'Edit, with existing tag w/o access', ( args, { registry } ) => {
		const { accounts, properties, profiles } = fixtures.accountsPropertiesProfiles;

		const existingTag = {
			accountID: '12345678',
			propertyID: 'UA-12345678-1',
		};

		registry.dispatch( STORE_NAME ).receiveGetAccounts( accounts );
		registry.dispatch( STORE_NAME ).receiveGetProperties( properties, { accountID: properties[ 0 ].accountId } ); // eslint-disable-line sitekit/acronym-case
		registry.dispatch( STORE_NAME ).receiveGetProfiles( profiles, {
			accountID: properties[ 0 ].accountId, // eslint-disable-line sitekit/acronym-case
			propertyID: profiles[ 0 ].webPropertyId, // eslint-disable-line sitekit/acronym-case
		} );
		registry.dispatch( STORE_NAME ).receiveGetSettings( defaultSettings );
		registry.dispatch( STORE_NAME ).receiveGetExistingTag( existingTag.propertyID );
		registry.dispatch( STORE_NAME ).receiveGetTagPermission( {
			accountID: existingTag.accountID,
			permission: false,
		}, { propertyID: existingTag.propertyID } );

		return <Settings registry={ registry } route="/connected-services/analytics/edit" />;
	}, {
		decorators: [
			withRegistry,
		],
	} )
	.add( 'No Tag, GTM property w/ access', usingGenerateGTMAnalyticsPropertyStory( { useExistingTag: false, gtmPermission: true } ) )
	.add( 'No Tag, GTM property w/o access', usingGenerateGTMAnalyticsPropertyStory( { useExistingTag: false, gtmPermission: false } ) )
	.add( 'Existing Tag w/ access, GTM property w/ access', usingGenerateGTMAnalyticsPropertyStory( { useExistingTag: true, gtmPermission: true, gaPermission: true } ) )
	.add( 'Existing Tag w/ access, GTM property w/o access', usingGenerateGTMAnalyticsPropertyStory( { useExistingTag: true, gtmPermission: false, gaPermission: true } ) )
	.add( 'Existing Tag w/o access, GTM property w/ access', usingGenerateGTMAnalyticsPropertyStory( { useExistingTag: true, gtmPermission: true, gaPermission: false } ) )
	.add( 'Existing Tag w/o access, GTM property w/o access', usingGenerateGTMAnalyticsPropertyStory( { useExistingTag: true, gtmPermission: false, gaPermission: false } ) )
;
