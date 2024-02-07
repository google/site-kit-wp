/**
 * SetupBanner Component Stories.
 *
 * Site Kit by Google, Copyright 2022 Google LLC
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
import fetchMock from 'fetch-mock';

/**
 * Internal dependencies
 */
import SetupBanner from './SetupBanner';
import {
	provideModuleRegistrations,
	provideModules,
} from '../../../../../../../tests/js/utils';
import WithRegistrySetup from '../../../../../../../tests/js/WithRegistrySetup';
import { MODULES_ANALYTICS_4 } from '../../../datastore/constants';
import { CORE_SITE } from '../../../../../googlesitekit/datastore/site/constants';
import * as fixtures from '../../../../analytics/datastore/__fixtures__';
import * as ga4Fixtures from '../../../../analytics-4/datastore/__fixtures__';

const { createProperty, createWebDataStream, properties, webDataStreams } =
	ga4Fixtures;
const { accounts, properties: uaProps } = fixtures.accountsPropertiesProfiles;
const accountID = createProperty._accountID;
const propertyID = createWebDataStream._propertyID;

function Template( args ) {
	return <SetupBanner { ...args } />;
}

export const NoPropertyNoTag = Template.bind( {} );
NoPropertyNoTag.storyName = 'No GA4 Property - No Existing Tag';
NoPropertyNoTag.decorators = [
	( Story ) => {
		const setupRegistry = ( registry ) => {
			registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetProperties( [], {
				accountID,
			} );
			registry
				.dispatch( MODULES_ANALYTICS_4 )
				.finishResolution( 'getProperties', [ accountID ] );
		};

		return (
			<WithRegistrySetup func={ setupRegistry }>
				<Story />
			</WithRegistrySetup>
		);
	},
];

export const NoPropertyNoTagNoEditScope = Template.bind( {} );
NoPropertyNoTagNoEditScope.storyName =
	'No GA4 Property - No Tag - No Edit Scope';
NoPropertyNoTagNoEditScope.decorators = [
	( Story ) => {
		const setupRegistry = ( registry ) => {
			const grantedScope =
				'https://www.googleapis.com/auth/granted.scope';

			fetchMock.getOnce(
				new RegExp(
					'^/google-site-kit/v1/core/user/data/authentication'
				),
				{
					body: {
						authenticated: true,
						requiredScopes: [],
						grantedScopes: [ grantedScope ],
						unsatisfiedScopes: [],
					},
					status: 200,
				}
			);

			registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetProperties( [], {
				accountID,
			} );
			registry
				.dispatch( MODULES_ANALYTICS_4 )
				.finishResolution( 'getProperties', [ accountID ] );
		};

		return (
			<WithRegistrySetup func={ setupRegistry }>
				<Story />
			</WithRegistrySetup>
		);
	},
];

export const WithPropertyNoTag = Template.bind( {} );
WithPropertyNoTag.storyName = 'Existing GA4 Property - No Existing Tag';
WithPropertyNoTag.decorators = [
	( Story ) => {
		const setupRegistry = ( registry ) => {
			registry
				.dispatch( MODULES_ANALYTICS_4 )
				.receiveGetProperties( properties, {
					accountID,
				} );
			registry
				.dispatch( MODULES_ANALYTICS_4 )
				.finishResolution( 'getProperties', [ accountID ] );

			registry
				.dispatch( MODULES_ANALYTICS_4 )
				.receiveGetWebDataStreams( webDataStreams, {
					propertyID,
				} );
			registry
				.dispatch( MODULES_ANALYTICS_4 )
				.finishResolution( 'receiveGetWebDataStreams', {
					propertyID,
				} );
		};

		return (
			<WithRegistrySetup func={ setupRegistry }>
				<Story />
			</WithRegistrySetup>
		);
	},
];

export const WithPropertyAndTag = Template.bind( {} );
WithPropertyAndTag.storyName = 'Existing GA4 Property - Existing Tag';
WithPropertyAndTag.decorators = [
	( Story ) => {
		const setupRegistry = ( registry ) => {
			registry
				.dispatch( MODULES_ANALYTICS_4 )
				.receiveGetProperties( properties, {
					accountID,
				} );
			registry
				.dispatch( MODULES_ANALYTICS_4 )
				.finishResolution( 'getProperties', [ accountID ] );

			registry
				.dispatch( MODULES_ANALYTICS_4 )
				.receiveGetWebDataStreams( webDataStreams, {
					propertyID,
				} );
			registry
				.dispatch( MODULES_ANALYTICS_4 )
				.finishResolution( 'receiveGetWebDataStreams', {
					propertyID,
				} );

			registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetExistingTag(
				// eslint-disable-next-line sitekit/acronym-case
				ga4Fixtures.webDataStreams[ 0 ].webStreamData.measurementId
			);
			registry.dispatch( MODULES_ANALYTICS_4 ).setUseSnippet( false );
		};

		return (
			<WithRegistrySetup func={ setupRegistry }>
				<Story />
			</WithRegistrySetup>
		);
	},
];

export const WithPropertyAndTagNoEditScope = Template.bind( {} );
WithPropertyAndTagNoEditScope.storyName =
	'Existing GA4 Property - Existing Tag (No edit scope)';
WithPropertyAndTagNoEditScope.decorators = [
	( Story ) => {
		const setupRegistry = ( registry ) => {
			const grantedScope =
				'https://www.googleapis.com/auth/granted.scope';

			fetchMock.getOnce(
				new RegExp(
					'^/google-site-kit/v1/core/user/data/authentication'
				),
				{
					body: {
						authenticated: true,
						requiredScopes: [],
						grantedScopes: [ grantedScope ],
						unsatisfiedScopes: [],
					},
					status: 200,
				}
			);

			registry
				.dispatch( MODULES_ANALYTICS_4 )
				.receiveGetProperties( properties, {
					accountID,
				} );
			registry
				.dispatch( MODULES_ANALYTICS_4 )
				.finishResolution( 'getProperties', [ accountID ] );

			registry
				.dispatch( MODULES_ANALYTICS_4 )
				.receiveGetWebDataStreams( webDataStreams, {
					propertyID,
				} );
			registry
				.dispatch( MODULES_ANALYTICS_4 )
				.finishResolution( 'receiveGetWebDataStreams', {
					propertyID,
				} );

			registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetExistingTag(
				// eslint-disable-next-line sitekit/acronym-case
				ga4Fixtures.webDataStreams[ 0 ].webStreamData.measurementId
			);
			registry.dispatch( MODULES_ANALYTICS_4 ).setUseSnippet( false );
		};

		return (
			<WithRegistrySetup func={ setupRegistry }>
				<Story />
			</WithRegistrySetup>
		);
	},
];

export const NoPropertyWithTag = Template.bind( {} );
NoPropertyWithTag.storyName = 'No GA4 Property - Existing Tag';
NoPropertyWithTag.decorators = [
	( Story ) => {
		const setupRegistry = ( registry ) => {
			registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetProperties( [], {
				accountID,
			} );
			registry
				.dispatch( MODULES_ANALYTICS_4 )
				.finishResolution( 'getProperties', [ accountID ] );

			registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetExistingTag(
				// eslint-disable-next-line sitekit/acronym-case
				ga4Fixtures.webDataStreams[ 0 ].webStreamData.measurementId
			);
		};

		return (
			<WithRegistrySetup func={ setupRegistry }>
				<Story />
			</WithRegistrySetup>
		);
	},
];

export default {
	title: 'Modules/Analytics4/SetupBanner',
	args: {
		onSubmitSuccess: () => {},
	},
	decorators: [
		( Story ) => {
			const setupRegistry = ( registry ) => {
				provideModules( registry, [
					{
						slug: 'analytics-4',
						active: true,
						connected: true,
					},
				] );

				provideModuleRegistrations( registry );

				registry.dispatch( CORE_SITE ).receiveSiteInfo( {
					referenceSiteURL: 'http://example.com',
				} );
				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.receiveGetSettings( {} );
				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.setAccountID( accountID );

				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.receiveGetAccountSummaries( accounts );
				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.finishResolution( 'getAccountSummaries', [] );

				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.receiveGetProperties( uaProps, {
						accountID,
					} );
				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.finishResolution( 'getProperties', [ accountID ] );

				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.receiveGetExistingTag( null );

				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.selectAccount( accountID );
			};

			return (
				<WithRegistrySetup func={ setupRegistry }>
					<Story />
				</WithRegistrySetup>
			);
		},
	],
};
