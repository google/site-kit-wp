/**
 * Analytics Settings stories.
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
import { SettingsMain as AnalyticsSettings } from '../assets/js/modules/analytics/components/settings';
import { fillFilterWithComponent } from '../assets/js/util';
import * as fixtures from '../assets/js/modules/analytics/datastore/__fixtures__';
import { STORE_NAME, PROFILE_CREATE } from '../assets/js/modules/analytics/datastore/constants';
import createLegacySettingsWrapper from './utils/create-legacy-settings-wrapper';

function filterAnalyticsSettings() {
	// set( global, 'googlesitekit.modules.analytics.setupComplete', true );
	removeAllFilters( 'googlesitekit.ModuleSettingsDetails-analytics' );
	addFilter(
		'googlesitekit.ModuleSettingsDetails-analytics',
		'googlesitekit.AnalyticsModuleSettings',
		fillFilterWithComponent( AnalyticsSettings )
	);
}

const completeModuleData = {
	...global._googlesitekitLegacyData.modules.analytics,
	active: true,
	setupComplete: true,
};

const Settings = createLegacySettingsWrapper( 'analytics', AnalyticsSettings );

storiesOf( 'Analytics Module/Settings', module )
	.add( 'View, closed', () => {
		filterAnalyticsSettings();

		const setupRegistry = ( { dispatch } ) => {
			dispatch( STORE_NAME ).receiveGetSettings( {} );
		};

		return <Settings isOpen={ false } module={ completeModuleData } callback={ setupRegistry } />;
	} )
	.add( 'View, open with all settings', () => {
		filterAnalyticsSettings();

		const setupRegistry = ( { dispatch } ) => {
			dispatch( STORE_NAME ).receiveGetExistingTag( null );
			dispatch( STORE_NAME ).receiveGetSettings( {
				accountID: '1234567890',
				propertyID: 'UA-1234567890-1',
				internalWebPropertyID: '135791113',
				profileID: '9999999',
				anonymizeIP: true,
				useSnippet: true,
				trackingDisabled: [ 'loggedinUsers' ],
			} );
		};

		return <Settings module={ completeModuleData } callback={ setupRegistry } />;
	} )
	.add( 'View, open with all settings, no snippet with existing tag', () => {
		filterAnalyticsSettings();

		const setupRegistry = ( { dispatch } ) => {
			dispatch( STORE_NAME ).receiveGetExistingTag( 'UA-1234567890-1' );
			dispatch( STORE_NAME ).receiveGetTagPermission( {
				accountID: '1234567890',
				permission: true,
			}, { propertyID: 'UA-1234567890-1' } );
			dispatch( STORE_NAME ).receiveGetSettings( {
				accountID: '1234567890',
				propertyID: 'UA-1234567890-1',
				internalWebPropertyID: '135791113',
				profileID: '9999999',
				anonymizeIP: true,
				useSnippet: false,
				trackingDisabled: [ 'loggedinUsers' ],
			} );
		};

		return <Settings module={ completeModuleData } callback={ setupRegistry } />;
	} )
	.add( 'Edit, open with all settings', () => {
		filterAnalyticsSettings();

		const { accounts, properties, profiles } = fixtures.accountsPropertiesProfiles;
		const { accountId, webPropertyId, id: profileID } = profiles[ 0 ];
		const { internalWebPropertyId } = properties.find( ( property ) => webPropertyId === property.id );
		const setupRegistry = ( { dispatch } ) => {
			dispatch( STORE_NAME ).receiveGetExistingTag( null );
			dispatch( STORE_NAME ).receiveGetAccounts( accounts );
			dispatch( STORE_NAME ).receiveGetProperties( properties, { accountID: properties[ 0 ].accountId } );
			dispatch( STORE_NAME ).receiveGetProfiles( profiles, {
				accountID: properties[ 0 ].accountId,
				propertyID: profiles[ 0 ].webPropertyId,
			} );
			dispatch( STORE_NAME ).receiveGetSettings( {
				accountID: accountId,
				propertyID: webPropertyId,
				internalWebPropertyID: internalWebPropertyId,
				profileID,
				anonymizeIP: true,
				useSnippet: true,
				trackingDisabled: [ 'loggedinUsers' ],
			} );
		};

		return <Settings isEditing={ true } module={ completeModuleData } callback={ setupRegistry } />;
	} )
	.add( 'Edit, open when creating new view', () => {
		filterAnalyticsSettings();

		const { accounts, properties, profiles } = fixtures.accountsPropertiesProfiles;
		const { accountId, webPropertyId, id: profileID } = profiles[ 0 ];
		const { internalWebPropertyId } = properties.find( ( property ) => webPropertyId === property.id );
		const setupRegistry = ( { dispatch } ) => {
			dispatch( STORE_NAME ).receiveGetExistingTag( null );
			dispatch( STORE_NAME ).receiveGetAccounts( accounts );
			dispatch( STORE_NAME ).receiveGetProperties( properties, { accountID: accountId } );
			dispatch( STORE_NAME ).receiveGetProfiles( profiles, {
				accountID: accountId,
				propertyID: webPropertyId,
			} );
			dispatch( STORE_NAME ).receiveGetSettings( {
				accountID: accountId,
				propertyID: webPropertyId,
				internalWebPropertyID: internalWebPropertyId,
				profileID,
				anonymizeIP: true,
				useSnippet: true,
				trackingDisabled: [ 'loggedinUsers' ],
			} );
			// This is chosen by the user, not received from API.
			dispatch( STORE_NAME ).setSettings( {
				profileID: PROFILE_CREATE,
			} );
		};

		return <Settings isEditing={ true } module={ completeModuleData } callback={ setupRegistry } />;
	} )
	.add( 'Edit, open with no accounts', () => {
		filterAnalyticsSettings();

		const setupRegistry = ( { dispatch } ) => {
			dispatch( STORE_NAME ).receiveGetExistingTag( null );
			dispatch( STORE_NAME ).receiveGetSettings( {} );
			dispatch( STORE_NAME ).receiveGetAccounts( [] );
		};

		return <Settings isEditing={ true } module={ completeModuleData } callback={ setupRegistry } />;
	} )
	.add( 'Edit, with existing tag (with access)', () => {
		filterAnalyticsSettings();

		const { accounts, properties, profiles, matchedProperty } = fixtures.accountsPropertiesProfiles;
		const existingTag = {
			accountID: matchedProperty.accountId,
			propertyID: matchedProperty.id,
		};
		const setupRegistry = ( { dispatch } ) => {
			dispatch( STORE_NAME ).receiveGetExistingTag( existingTag.propertyID );
			dispatch( STORE_NAME ).receiveGetAccounts( accounts );
			dispatch( STORE_NAME ).receiveGetProperties( properties, { accountID: properties[ 0 ].accountId } );
			dispatch( STORE_NAME ).receiveGetProfiles( profiles, {
				accountID: properties[ 0 ].accountId,
				propertyID: profiles[ 0 ].webPropertyId,
			} );
			dispatch( STORE_NAME ).receiveGetSettings( {
				accountID: '',
				propertyID: '',
				profileID: '',
				internalWebPropertyID: '',
				anonymizeIP: true,
				useSnippet: true,
				trackingDisabled: [ 'loggedinUsers' ],
			} );
			dispatch( STORE_NAME ).receiveGetTagPermission( {
				accountID: existingTag.accountID,
				permission: true,
			}, { propertyID: existingTag.propertyID } );
		};

		return <Settings isEditing={ true } module={ completeModuleData } callback={ setupRegistry } />;
	} )
	.add( 'Edit, with existing tag (no access)', () => {
		filterAnalyticsSettings();

		const existingTag = {
			accountID: '12345678',
			propertyID: 'UA-12345678-1',
		};
		const { accounts, properties, profiles } = fixtures.accountsPropertiesProfiles;
		const setupRegistry = ( { dispatch } ) => {
			dispatch( STORE_NAME ).receiveGetExistingTag( existingTag.propertyID );
			dispatch( STORE_NAME ).receiveGetTagPermission( {
				accountID: existingTag.accountID,
				permission: false,
			}, { propertyID: existingTag.propertyID } );
			dispatch( STORE_NAME ).receiveGetSettings( {} );
			dispatch( STORE_NAME ).receiveGetAccounts( accounts );
			dispatch( STORE_NAME ).receiveGetProperties( properties, { accountID: properties[ 0 ].accountId } );
			dispatch( STORE_NAME ).receiveGetProfiles( profiles, {
				accountID: properties[ 0 ].accountId,
				propertyID: profiles[ 0 ].webPropertyId,
			} );
		};

		return <Settings isEditing={ true } module={ completeModuleData } callback={ setupRegistry } />;
	} )
;
