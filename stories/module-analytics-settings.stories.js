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
import SettingsModule from '../assets/js/components/settings/settings-module';
import { SettingsMain as AnalyticsSettings } from '../assets/js/modules/analytics/components/settings';
import { fillFilterWithComponent } from '../assets/js/util';
import * as fixtures from '../assets/js/modules/analytics/datastore/__fixtures__';
import { STORE_NAME, PROFILE_CREATE } from '../assets/js/modules/analytics/datastore/constants';
import { STORE_NAME as CORE_SITE, AMP_MODE_SECONDARY } from '../assets/js/googlesitekit/datastore/site/constants';
import { STORE_NAME as CORE_MODULES } from '../assets/js/googlesitekit/modules/datastore/constants';
import { WithTestRegistry } from '../tests/js/utils';
import { createBuildAndReceivers } from '../assets/js/modules/tagmanager/datastore/__factories__/utils';

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

function Settings( props ) {
	const {
		callback,
		module = global._googlesitekitLegacyData.modules.analytics,
		isEditing = false,
		isOpen = true,
		isSaving = false,
		error = false,
		// eslint-disable-next-line no-console
		handleAccordion = ( ...args ) => console.log( 'handleAccordion', ...args ),
		// eslint-disable-next-line no-console
		handleDialog = ( ...args ) => console.log( 'handleDialog', ...args ),
		// eslint-disable-next-line no-console
		updateModulesList = ( ...args ) => console.log( 'updateModulesList', ...args ),
		// eslint-disable-next-line no-console
		handleButtonAction = ( ...args ) => console.log( 'handleButtonAction', ...args ),
	} = props;

	return (
		<WithTestRegistry callback={ callback }>
			<div style={ { background: 'white' } }>
				<SettingsModule
					key={ module.slug + '-module' }
					slug={ module.slug }
					name={ module.name }
					description={ module.description }
					homepage={ module.homepage }
					learnmore={ module.learnMore }
					active={ module.active }
					setupComplete={ module.setupComplete }
					hasSettings={ true }
					autoActivate={ module.autoActivate }
					updateModulesList={ updateModulesList }
					handleEdit={ handleButtonAction }
					handleConfirm
					isEditing={ isEditing ? { 'analytics-module': true } : {} }
					isOpen={ isOpen }
					handleAccordion={ handleAccordion }
					handleDialog={ handleDialog }
					provides={ module.provides }
					isSaving={ isSaving }
					screenID={ module.screenID }
					error={ error }
				/>
			</div>
		</WithTestRegistry>
	);
}

function makeGtmPropertyStory( { permission, useExistingTag = false } ) {
	return () => {
		const setupRegistry = ( registry ) => {
			const data = {
				accountID: '152925174',
				webPropertyID: 'UA-152925174-1',
				ampPropertyID: 'UA-152925174-1',
			};

			const { accounts, properties, profiles } = fixtures.accountsPropertiesProfiles;

			registry.dispatch( CORE_MODULES ).receiveGetModules( [
				{
					slug: 'tagmanager',
					name: 'Tag Manager',
					description: 'Tag Manager creates an easy to manage way to create tags on your site without updating code.',
					homepage: 'https://tagmanager.google.com/',
					internal: false,
					active: true,
					connected: true,
					dependencies: [ 'analytics' ],
					dependants: [],
					order: 10,
				},
			] );

			registry.dispatch( CORE_SITE ).receiveSiteInfo( {
				homeURL: 'https://example.com/',
				ampMode: AMP_MODE_SECONDARY,
			} );

			registry.dispatch( STORE_NAME ).receiveGetSettings( {} );
			registry.dispatch( STORE_NAME ).receiveGetAccounts( accounts );
			registry.dispatch( STORE_NAME ).receiveGetProperties( properties, { accountID: properties[ 0 ].accountId } );
			registry.dispatch( STORE_NAME ).receiveGetProfiles( profiles, {
				accountID: properties[ 0 ].accountId,
				propertyID: profiles[ 0 ].webPropertyId,
			} );

			if ( useExistingTag ) {
				registry.dispatch( STORE_NAME ).receiveGetExistingTag( data.webPropertyID );
			}

			registry.dispatch( STORE_NAME ).receiveGetTagPermission( {
				accountID: data.accountID,
				permission,
			}, { propertyID: data.webPropertyID } );

			const { buildAndReceiveWebAndAMP } = createBuildAndReceivers( registry );
			buildAndReceiveWebAndAMP( data );
		};

		return <Settings isEditing={ true } module={ completeModuleData } callback={ setupRegistry } />;
	};
}

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
	.add( 'Edit, with existing tag w/ access', () => {
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
	.add( 'Edit, with existing tag w/o access', () => {
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
	.add( 'No Tag, GTM property w/ access', makeGtmPropertyStory( { permission: true } ) )
	.add( 'No Tag, GTM property w/o access', makeGtmPropertyStory( { permission: false } ) )
	.add( 'Existing Tag, GTM property w/ access', makeGtmPropertyStory( { permission: true, useExistingTag: true } ) )
	.add( 'Existing Tag, GTM property w/o access', makeGtmPropertyStory( { permission: false, useExistingTag: true } ) )
;
