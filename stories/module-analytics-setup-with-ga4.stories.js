/**
 * Analytics Setup stories.
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
import ModuleSetup from '../assets/js/components/setup/ModuleSetup';
import * as fixtures from '../assets/js/modules/analytics/datastore/__fixtures__';
import * as ga4Fixtures from '../assets/js/modules/analytics-4/datastore/__fixtures__';
import { MODULES_ANALYTICS, ACCOUNT_CREATE, PROVISIONING_SCOPE } from '../assets/js/modules/analytics/datastore/constants';
import { CORE_SITE } from '../assets/js/googlesitekit/datastore/site/constants';
import { CORE_USER } from '../assets/js/googlesitekit/datastore/user/constants';
import { MODULES_ANALYTICS_4 } from '../assets/js/modules/analytics-4/datastore/constants';
import {
	WithTestRegistry,
	createTestRegistry,
	provideModules,
	provideModuleRegistrations,
} from '../tests/js/utils';

function Setup( props ) {
	return (
		<WithTestRegistry
			features={ [ 'ga4setup' ] }
			{ ...props }
		>
			<h1>live reload</h1>
			<ModuleSetup moduleSlug="analytics" />
		</WithTestRegistry>
	);
}

const withRegistry = ( Story ) => {
	global._googlesitekitLegacyData.setup.moduleToSetup = 'analytics';
	const registry = createTestRegistry();
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

storiesOf( 'Analytics Module/Setup - UA and GA4', module )
	.add( 'Create Account (scope granted)', ( args, { registry } ) => {
		const { accounts, properties, profiles } = fixtures.accountsPropertiesProfiles;
		registry.dispatch( CORE_SITE ).receiveSiteInfo( {
			usingProxy: true,
			referenceSiteURL: 'http://example.com',
			timezone: 'America/Detroit',
			siteName: 'My Site Name',
		} );
		registry.dispatch( CORE_USER ).receiveGetAuthentication( {
			authenticated: true,
			requiredScopes: [],
			grantedScopes: [ PROVISIONING_SCOPE ],
		} );
		registry.dispatch( MODULES_ANALYTICS ).receiveGetExistingTag( null );
		registry.dispatch( MODULES_ANALYTICS ).receiveGetAccounts( accounts );
		// eslint-disable-next-line sitekit/acronym-case
		registry.dispatch( MODULES_ANALYTICS ).receiveGetProperties( properties, { accountID: properties[ 0 ].accountId } );
		registry.dispatch( MODULES_ANALYTICS ).receiveGetProfiles( profiles, {
			// eslint-disable-next-line sitekit/acronym-case
			accountID: properties[ 0 ].accountId,
			// eslint-disable-next-line sitekit/acronym-case
			propertyID: profiles[ 0 ].webPropertyId,
		} );
		registry.dispatch( MODULES_ANALYTICS ).receiveGetSettings( {
			accountID: ACCOUNT_CREATE,
		} );

		// eslint-disable-next-line sitekit/acronym-case
		registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetProperties( ga4Fixtures.properties, { accountID: properties[ 0 ].accountId } );

		return <Setup registry={ registry } />;
	}, {
		decorators: [
			withRegistry,
		],
	} )
;
