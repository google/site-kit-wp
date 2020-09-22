/**
 * Analytics Setup stories.
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
import SetupWrapper from '../assets/js/components/setup/setup-wrapper';
import { SetupMain as AnalyticsSetup } from '../assets/js/modules/analytics/components/setup/index';
import { fillFilterWithComponent } from '../assets/js/util';
import * as fixtures from '../assets/js/modules/analytics/datastore/__fixtures__';

import { STORE_NAME, ACCOUNT_CREATE, PROFILE_CREATE, PROVISIONING_SCOPE } from '../assets/js/modules/analytics/datastore/constants';
import { STORE_NAME as CORE_SITE } from '../assets/js/googlesitekit/datastore/site/constants';
import { STORE_NAME as CORE_USER } from '../assets/js/googlesitekit/datastore/user/constants';
import { WithTestRegistry } from '../tests/js/utils';
import { generateGtmPropertyStory } from './utils/analytics';

function filterAnalyticsSetup() {
	global._googlesitekitLegacyData.setup.moduleToSetup = 'analytics';

	removeAllFilters( 'googlesitekit.ModuleSetup-analytics' );
	addFilter(
		'googlesitekit.ModuleSetup-analytics',
		'googlesitekit.AnalyticsModuleSetup',
		fillFilterWithComponent( AnalyticsSetup )
	);
}

function Setup( props ) {
	return (
		<WithTestRegistry { ...props }>
			<SetupWrapper />
		</WithTestRegistry>
	);
}

function generateGtmPropertyStoryCallback( permission, useExistingTag = false ) {
	return generateGtmPropertyStory( {
		Component: Setup,
		permission,
		useExistingTag,
	} );
}

storiesOf( 'Analytics Module/Setup', module )
	.add( 'Loading', () => {
		filterAnalyticsSetup();

		const setupRegistry = ( registry ) => {
			registry.dispatch( STORE_NAME ).receiveGetSettings( {} );
			registry.dispatch( STORE_NAME ).receiveGetExistingTag( null );
		};

		return <Setup callback={ setupRegistry } />;
	} )
	.add( 'Start', () => {
		filterAnalyticsSetup();

		const { accounts, properties, profiles } = fixtures.accountsPropertiesProfiles;
		const setupRegistry = ( { dispatch } ) => {
			dispatch( STORE_NAME ).receiveGetSettings( {} );
			dispatch( STORE_NAME ).receiveGetAccounts( accounts );
			dispatch( STORE_NAME ).receiveGetProperties( properties, { accountID: properties[ 0 ].accountId } );
			dispatch( STORE_NAME ).receiveGetProfiles( profiles, {
				accountID: properties[ 0 ].accountId,
				propertyID: profiles[ 0 ].webPropertyId,
			} );
			dispatch( STORE_NAME ).receiveGetExistingTag( null );
		};

		return <Setup callback={ setupRegistry } />;
	} )
	.add( 'Start (with matched property)', () => {
		filterAnalyticsSetup();

		const { accounts, properties, profiles, matchedProperty } = fixtures.accountsPropertiesProfiles;
		const setupRegistry = ( { dispatch } ) => {
			dispatch( STORE_NAME ).receiveGetSettings( {} );
			dispatch( STORE_NAME ).receiveGetAccounts( accounts );
			dispatch( STORE_NAME ).receiveGetProperties( properties, { accountID: properties[ 0 ].accountId } );
			dispatch( STORE_NAME ).receiveGetProfiles( profiles, {
				accountID: properties[ 0 ].accountId,
				propertyID: profiles[ 0 ].webPropertyId,
			} );
			dispatch( STORE_NAME ).receiveGetExistingTag( null );
			dispatch( STORE_NAME ).receiveMatchedProperty( matchedProperty );
		};

		return <Setup callback={ setupRegistry } />;
	} )
	.add( 'Create new view', () => {
		filterAnalyticsSetup();

		const { accounts, properties, profiles } = fixtures.accountsPropertiesProfiles;
		const { accountId, webPropertyId } = profiles[ 0 ];
		const { internalWebPropertyId } = properties.find( ( property ) => webPropertyId === property.id );
		const setupRegistry = ( { dispatch } ) => {
			dispatch( STORE_NAME ).receiveGetSettings( {} );
			dispatch( STORE_NAME ).receiveGetAccounts( accounts );
			dispatch( STORE_NAME ).receiveGetProperties( properties, { accountID: accountId } );
			dispatch( STORE_NAME ).receiveGetProfiles( profiles, {
				accountID: accountId,
				propertyID: webPropertyId,
			} );
			dispatch( STORE_NAME ).receiveGetExistingTag( null );
			dispatch( STORE_NAME ).setSettings( {
				accountID: accountId,
				propertyID: webPropertyId,
				internalWebPropertyID: internalWebPropertyId,
				profileID: PROFILE_CREATE,
				anonymizeIP: true,
				useSnippet: true,
				trackingDisabled: [ 'loggedinUsers' ],
			} );
		};

		return <Setup callback={ setupRegistry } />;
	} )
	.add( 'Create Account Legacy (no accounts)', () => {
		filterAnalyticsSetup();

		const setupRegistry = ( { dispatch } ) => {
			dispatch( STORE_NAME ).receiveGetSettings( {} );
			dispatch( STORE_NAME ).receiveGetAccounts( [] );
			dispatch( STORE_NAME ).receiveGetExistingTag( null );
		};

		return <Setup callback={ setupRegistry } />;
	} )
	.add( 'Create Account Legacy (new account option)', () => {
		filterAnalyticsSetup();

		const { accounts, properties, profiles } = fixtures.accountsPropertiesProfiles;
		const setupRegistry = ( { dispatch } ) => {
			dispatch( STORE_NAME ).receiveGetExistingTag( null );
			dispatch( STORE_NAME ).receiveGetAccounts( accounts );
			dispatch( STORE_NAME ).receiveGetProperties( properties, { accountID: properties[ 0 ].accountId } );
			dispatch( STORE_NAME ).receiveGetProfiles( profiles, {
				accountID: properties[ 0 ].accountId,
				propertyID: profiles[ 0 ].webPropertyId,
			} );
			dispatch( STORE_NAME ).receiveGetSettings( {
				accountID: ACCOUNT_CREATE,
			} );
		};

		return <Setup callback={ setupRegistry } />;
	} )
	.add( 'Create Account (scope not granted)', () => {
		filterAnalyticsSetup();

		const { accounts, properties, profiles } = fixtures.accountsPropertiesProfiles;
		const setupRegistry = ( { dispatch } ) => {
			dispatch( CORE_SITE ).receiveSiteInfo( {
				usingProxy: true,
				referenceSiteURL: 'http://example.com',
				timezone: 'America/Detroit',
				siteName: 'My Site Name',
			} );
			dispatch( CORE_USER ).receiveGetAuthentication( {
				authenticated: true,
				requiredScopes: [],
				grantedScopes: [],
			} );
			dispatch( STORE_NAME ).receiveGetExistingTag( null );
			dispatch( STORE_NAME ).receiveGetAccounts( accounts );
			dispatch( STORE_NAME ).receiveGetProperties( properties, { accountID: properties[ 0 ].accountId } );
			dispatch( STORE_NAME ).receiveGetProfiles( profiles, {
				accountID: properties[ 0 ].accountId,
				propertyID: profiles[ 0 ].webPropertyId,
			} );
			dispatch( STORE_NAME ).receiveGetSettings( {
				accountID: ACCOUNT_CREATE,
			} );
		};

		return <Setup callback={ setupRegistry } />;
	} )
	.add( 'Create Account (scope granted)', () => {
		filterAnalyticsSetup();

		const { accounts, properties, profiles } = fixtures.accountsPropertiesProfiles;
		const setupRegistry = ( { dispatch } ) => {
			dispatch( CORE_SITE ).receiveSiteInfo( {
				usingProxy: true,
				referenceSiteURL: 'http://example.com',
				timezone: 'America/Detroit',
				siteName: 'My Site Name',
			} );
			dispatch( CORE_USER ).receiveGetAuthentication( {
				authenticated: true,
				requiredScopes: [],
				grantedScopes: [ PROVISIONING_SCOPE ],
			} );
			dispatch( STORE_NAME ).receiveGetExistingTag( null );
			dispatch( STORE_NAME ).receiveGetAccounts( accounts );
			dispatch( STORE_NAME ).receiveGetProperties( properties, { accountID: properties[ 0 ].accountId } );
			dispatch( STORE_NAME ).receiveGetProfiles( profiles, {
				accountID: properties[ 0 ].accountId,
				propertyID: profiles[ 0 ].webPropertyId,
			} );
			dispatch( STORE_NAME ).receiveGetSettings( {
				accountID: ACCOUNT_CREATE,
			} );
		};

		return <Setup callback={ setupRegistry } />;
	} )
	.add( 'Existing Tag w/ access', () => {
		filterAnalyticsSetup();

		const { accounts, properties, profiles } = fixtures.accountsPropertiesProfiles;
		const existingTag = {
			accountID: properties[ 0 ].accountId,
			propertyID: properties[ 0 ].id,
		};

		const setupRegistry = ( { dispatch } ) => {
			dispatch( STORE_NAME ).receiveGetSettings( {} );
			dispatch( STORE_NAME ).receiveGetAccounts( accounts );
			dispatch( STORE_NAME ).receiveGetProperties( properties, { accountID: properties[ 0 ].accountId } );
			dispatch( STORE_NAME ).receiveGetProfiles( profiles, {
				accountID: properties[ 0 ].accountId,
				propertyID: profiles[ 0 ].webPropertyId,
			} );
			dispatch( STORE_NAME ).receiveGetExistingTag( existingTag.propertyID );
			dispatch( STORE_NAME ).receiveGetTagPermission( {
				accountID: existingTag.accountID,
				permission: true,
			}, { propertyID: existingTag.propertyID } );
		};

		return <Setup callback={ setupRegistry } />;
	} )
	.add( 'Existing Tag w/o access', () => {
		filterAnalyticsSetup();

		const existingTag = {
			accountID: '12345678',
			propertyID: 'UA-12345678-1',
		};
		const { accounts, properties, profiles } = fixtures.accountsPropertiesProfiles;
		const setupRegistry = ( { dispatch } ) => {
			dispatch( STORE_NAME ).receiveGetSettings( {} );
			dispatch( STORE_NAME ).receiveGetAccounts( accounts );
			dispatch( STORE_NAME ).receiveGetProperties( properties, { accountID: properties[ 0 ].accountId } );
			dispatch( STORE_NAME ).receiveGetProfiles( profiles, {
				accountID: properties[ 0 ].accountId,
				propertyID: profiles[ 0 ].webPropertyId,
			} );
			dispatch( STORE_NAME ).receiveGetExistingTag( existingTag.propertyID );
			dispatch( STORE_NAME ).receiveGetTagPermission( {
				accountID: existingTag.accountID,
				permission: false,
			}, { propertyID: existingTag.propertyID } );
		};

		return <Setup callback={ setupRegistry } />;
	} )
	.add( 'No Tag, GTM property w/ access', generateGtmPropertyStoryCallback( true ) )
	.add( 'No Tag, GTM property w/o access', generateGtmPropertyStoryCallback( false ) )
	.add( 'Existing Tag, GTM property w/ access', generateGtmPropertyStoryCallback( true, true ) )
	.add( 'Existing Tag, GTM property w/o access', generateGtmPropertyStoryCallback( false, true ) )
;
