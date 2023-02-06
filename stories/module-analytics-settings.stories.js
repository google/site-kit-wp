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
import Data from 'googlesitekit-data';
import {
	MODULES_ANALYTICS,
	PROFILE_CREATE,
} from '../assets/js/modules/analytics/datastore/constants';
import { MODULES_ANALYTICS_4 } from '../assets/js/modules/analytics-4/datastore/constants';
import { MODULES_TAGMANAGER } from '../assets/js/modules/tagmanager/datastore/constants';
import { CORE_MODULES } from '../assets/js/googlesitekit/modules/datastore/constants';
import { provideModules, provideModuleRegistrations } from '../tests/js/utils';
import createLegacySettingsWrapper from './utils/create-legacy-settings-wrapper';
import {
	accountsPropertiesProfiles,
	defaultSettings,
} from '../assets/js/modules/analytics/datastore/__fixtures__';
import {
	defaultSettings as ga4DefaultSettings,
	webDataStreamsBatch,
	properties as ga4Properties,
} from '../assets/js/modules/analytics-4/datastore/__fixtures__';

/* eslint-disable sitekit/acronym-case */
const { useRegistry } = Data;

const Settings = createLegacySettingsWrapper( 'analytics' );

function WithRegistry( Story ) {
	const registry = useRegistry();
	const { dispatch } = registry;

	dispatch( MODULES_ANALYTICS ).receiveGetSettings( {} );
	dispatch( MODULES_ANALYTICS ).receiveGetExistingTag( null );

	dispatch( MODULES_TAGMANAGER ).receiveGetSettings( {} );

	provideModules( registry, [
		{
			slug: 'analytics',
			active: true,
			connected: true,
		},
	] );
	provideModuleRegistrations( registry );

	return <Story registry={ registry } />;
}

storiesOf( 'Analytics Module/Settings', module )
	.add(
		'View, closed',
		( args, { registry } ) => {
			return (
				<Settings registry={ registry } route="/connected-services" />
			);
		},
		{
			decorators: [ WithRegistry ],
		}
	)
	.add(
		'View, open with all settings w/o GA4',
		( args, { registry } ) => {
			registry.dispatch( MODULES_ANALYTICS ).receiveGetSettings( {
				...defaultSettings,
				accountID: '1234567890',
				propertyID: 'UA-1234567890-1',
				internalWebPropertyID: '135791113',
				profileID: '9999999',
			} );

			return (
				<Settings
					registry={ registry }
					route="/connected-services/analytics"
				/>
			);
		},
		{
			decorators: [ WithRegistry ],
		}
	)
	.add(
		'View, open with all settings w/ GA4',
		( args, { registry } ) => {
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

			registry.dispatch( MODULES_ANALYTICS ).receiveGetSettings( {
				...defaultSettings,
				accountID: '1234567890',
				propertyID: 'UA-1234567890-1',
				internalWebPropertyID: '135791113',
				profileID: '9999999',
			} );

			registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetSettings( {
				...ga4DefaultSettings,
				propertyID: '1001',
				webDataStreamID: '2001',
				measurementID: 'G-12345ABCDE',
			} );

			return (
				<Settings
					registry={ registry }
					route="/connected-services/analytics"
					skipModulesProvide
				/>
			);
		},
		{
			decorators: [ WithRegistry ],
		}
	)
	.add(
		'View, open with all settings, no snippet with existing tag',
		( args, { registry } ) => {
			registry.dispatch( MODULES_ANALYTICS ).receiveGetSettings( {
				...defaultSettings,
				accountID: '1234567890',
				propertyID: 'UA-1234567890-1',
				internalWebPropertyID: '135791113',
				profileID: '9999999',
				useSnippet: false,
			} );
			registry
				.dispatch( MODULES_ANALYTICS )
				.receiveGetExistingTag( 'UA-1234567890-1' );

			return (
				<Settings
					registry={ registry }
					route="/connected-services/analytics"
				/>
			);
		},
		{
			decorators: [ WithRegistry ],
		}
	)
	.add(
		'Edit, open with all settings w/o GA4',
		( args, { registry } ) => {
			const { dispatch } = registry;
			const { accounts, properties, profiles } =
				accountsPropertiesProfiles;

			/* eslint-disable sitekit/acronym-case */
			const {
				accountId: accountID,
				webPropertyId: propertyID,
				id: profileID,
			} = profiles[ 0 ];
			/* eslint-enable */

			const {
				internalWebPropertyId: internalWebPropertyID, // eslint-disable-line sitekit/acronym-case
			} = properties.find( ( property ) => propertyID === property.id );

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
					connected: false,
					internal: true,
				},
			] );

			dispatch( MODULES_ANALYTICS ).receiveGetAccounts( accounts );
			dispatch( MODULES_ANALYTICS ).receiveGetProperties( properties, {
				accountID,
			} );
			dispatch( MODULES_ANALYTICS ).receiveGetProfiles( profiles, {
				accountID,
				propertyID,
			} );
			dispatch( MODULES_ANALYTICS ).receiveGetSettings( {
				...defaultSettings,
				accountID,
				propertyID,
				internalWebPropertyID,
				profileID,
			} );

			dispatch( MODULES_ANALYTICS_4 ).receiveGetProperties( [], {
				accountID,
			} );

			return (
				<Settings
					registry={ registry }
					route="/connected-services/analytics/edit"
				/>
			);
		},
		{
			decorators: [ WithRegistry ],
		}
	)
	.add(
		'Edit, open with all settings w/ GA4',
		( args, { registry } ) => {
			const { dispatch } = registry;
			const { accounts, properties, profiles } =
				accountsPropertiesProfiles;

			/* eslint-disable sitekit/acronym-case */
			const {
				accountId: accountID,
				webPropertyId,
				id: profileID,
			} = profiles[ 0 ];
			const { internalWebPropertyId } = properties.find(
				( property ) => webPropertyId === property.id
			);
			/* eslint-enable */

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

			dispatch( MODULES_ANALYTICS ).receiveGetAccounts( accounts );
			dispatch( MODULES_ANALYTICS ).receiveGetProperties( properties, {
				accountID,
			} );
			dispatch( MODULES_ANALYTICS ).receiveGetProfiles( profiles, {
				accountID,
				propertyID: profiles[ 0 ].webPropertyId, // eslint-disable-line sitekit/acronym-case
			} );
			dispatch( MODULES_ANALYTICS ).receiveGetSettings( {
				...defaultSettings,
				accountID,
				propertyID: webPropertyId, // eslint-disable-line sitekit/acronym-case
				internalWebPropertyID: internalWebPropertyId, // eslint-disable-line sitekit/acronym-case
				profileID,
			} );

			dispatch( MODULES_ANALYTICS_4 ).receiveGetSettings( {
				...ga4DefaultSettings,
				propertyID: '1001',
				webDataStreamID: '2001',
				measurementID: 'G-12345ABCDE',
			} );
			dispatch( MODULES_ANALYTICS_4 ).receiveGetProperties(
				[
					{
						_id: '1001',
						displayName: 'GA4 Property',
					},
				],
				{ accountID }
			);
			dispatch( MODULES_ANALYTICS_4 ).receiveGetWebDataStreams(
				[
					{
						_id: '2001',
						/* eslint-disable sitekit/acronym-case */
						measurementId: 'G-12345ABCDE',
						defaultUri: 'http://example.com',
						/* eslint-disable */
					},
				],
				{ propertyID: '1001' }
			);

			dispatch( MODULES_ANALYTICS_4 ).receiveGetWebDataStreamsBatch(
				webDataStreamsBatch,
				{
					propertyIDs: ga4Properties.map( ( { _id } ) => _id ),
				}
			);

			return (
				<Settings
					registry={ registry }
					route="/connected-services/analytics/edit"
					skipModulesProvide
				/>
			);
		},
		{
			decorators: [ WithRegistry ],
		}
	)
	.add(
		'Edit, open with all settings w/ GA4, w/o module access',
		( args, { registry } ) => {
			const { dispatch } = registry;
			const { accounts, properties, profiles } =
				accountsPropertiesProfiles;

			/* eslint-disable sitekit/acronym-case */
			const {
				accountId: accountID,
				webPropertyId,
				id: profileID,
			} = profiles[ 0 ];
			const { internalWebPropertyId } = properties.find(
				( property ) => webPropertyId === property.id
			);
			/* eslint-enable */

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
					owner: { login: 'test-owner-username' },
				},
				{
					slug: 'analytics-4',
					active: true,
					connected: true,
					internal: true,
				},
			] );

			dispatch( CORE_MODULES ).receiveCheckModuleAccess(
				{ access: false },
				{ slug: 'analytics' }
			);
			dispatch( CORE_MODULES ).receiveCheckModuleAccess(
				{ access: false },
				{ slug: 'analytics-4' }
			);

			dispatch( MODULES_ANALYTICS ).receiveGetAccounts( accounts );
			dispatch( MODULES_ANALYTICS ).receiveGetProperties( properties, {
				accountID,
			} );
			dispatch( MODULES_ANALYTICS ).receiveGetProfiles( profiles, {
				accountID,
				propertyID: profiles[ 0 ].webPropertyId, // eslint-disable-line sitekit/acronym-case
			} );
			dispatch( MODULES_ANALYTICS ).receiveGetSettings( {
				...defaultSettings,
				accountID,
				propertyID: webPropertyId, // eslint-disable-line sitekit/acronym-case
				internalWebPropertyID: internalWebPropertyId, // eslint-disable-line sitekit/acronym-case
				profileID,
			} );

			dispatch( MODULES_ANALYTICS_4 ).receiveGetSettings( {
				...ga4DefaultSettings,
				propertyID: '1001',
				webDataStreamID: '2001',
				measurementID: 'G-12345ABCDE',
			} );
			dispatch( MODULES_ANALYTICS_4 ).receiveGetProperties(
				[
					{
						_id: '1001',
						displayName: 'GA4 Property',
					},
				],
				{ accountID }
			);
			dispatch( MODULES_ANALYTICS_4 ).receiveGetWebDataStreams(
				[
					{
						_id: '2001',
						/* eslint-disable sitekit/acronym-case */
						measurementId: 'G-12345ABCDE',
						defaultUri: 'http://example.com',
						/* eslint-disable */
					},
				],
				{ propertyID: '1001' }
			);
			dispatch( MODULES_ANALYTICS_4 ).receiveGetWebDataStreamsBatch(
				webDataStreamsBatch,
				{
					propertyIDs: ga4Properties.map( ( { _id } ) => _id ),
				}
			);

			return (
				<Settings
					registry={ registry }
					route="/connected-services/analytics/edit"
					skipModulesProvide
				/>
			);
		},
		{
			decorators: [ WithRegistry ],
		}
	)
	.add(
		'Edit, open when creating new view',
		( args, { registry } ) => {
			const { dispatch } = registry;
			const { accounts, properties, profiles } =
				accountsPropertiesProfiles;

			// eslint-disable-next-line sitekit/acronym-case
			const { accountId, webPropertyId, id: profileID } = profiles[ 0 ];
			// eslint-disable-next-line sitekit/acronym-case
			const { internalWebPropertyId } = properties.find(
				( property ) => webPropertyId === property.id
			);

			dispatch( MODULES_ANALYTICS ).receiveGetAccounts( accounts );
			dispatch( MODULES_ANALYTICS ).receiveGetProperties( properties, {
				accountID: accountId,
			} ); // eslint-disable-line sitekit/acronym-case
			dispatch( MODULES_ANALYTICS ).receiveGetProfiles( profiles, {
				accountID: accountId, // eslint-disable-line sitekit/acronym-case
				propertyID: webPropertyId, // eslint-disable-line sitekit/acronym-case
			} );
			dispatch( MODULES_ANALYTICS ).receiveGetSettings( {
				...defaultSettings,
				accountID: accountId, // eslint-disable-line sitekit/acronym-case
				propertyID: webPropertyId, // eslint-disable-line sitekit/acronym-case
				internalWebPropertyID: internalWebPropertyId, // eslint-disable-line sitekit/acronym-case
				profileID,
			} );
			// This is chosen by the user, not received from API.
			dispatch( MODULES_ANALYTICS ).setSettings( {
				profileID: PROFILE_CREATE,
			} );

			dispatch( MODULES_ANALYTICS_4 ).receiveGetProperties( [], {
				accountID: accountId, // eslint-disable-line sitekit/acronym-case
			} );

			return (
				<Settings
					registry={ registry }
					route="/connected-services/analytics/edit"
				/>
			);
		},
		{
			decorators: [ WithRegistry ],
		}
	)
	.add(
		'Edit, open with no accounts',
		( args, { registry } ) => {
			const { dispatch } = registry;
			dispatch( MODULES_ANALYTICS ).receiveGetAccounts( [] );

			return (
				<Settings
					registry={ registry }
					route="/connected-services/analytics/edit"
				/>
			);
		},
		{
			decorators: [ WithRegistry ],
		}
	);
