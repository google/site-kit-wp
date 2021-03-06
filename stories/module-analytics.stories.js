/**
 * Analytics Stories.
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
import {
	AccountSelect,
	PropertySelect,
	PropertySelectIncludingGA4,
	ProfileSelect,
	AnonymizeIPSwitch,
	UseUASnippetSwitch,
	TrackingExclusionSwitches,
	GA4Notice,
} from '../assets/js/modules/analytics/components/common';
import { WithTestRegistry } from '../tests/js/utils';
import * as fixtures from '../assets/js/modules/analytics/datastore/__fixtures__';
import { properties as propertiesGA4 } from '../assets/js/modules/analytics-4/datastore/__fixtures__';
import { STORE_NAME } from '../assets/js/modules/analytics/datastore/constants';
import { MODULES_ANALYTICS_4 } from '../assets/js/modules/analytics-4/datastore/constants';
import { enabledFeatures } from '../assets/js/features';

function SetupWrap( { children } ) {
	return (
		<div className="googlesitekit-setup">
			<section className="googlesitekit-setup__wrapper">
				<div className="googlesitekit-setup-module">
					{ children }
				</div>
			</section>
		</div>
	);
}

storiesOf( 'Analytics Module', module )
	.add( 'Account Property Profile Select', () => {
		const setupRegistry = ( { dispatch } ) => {
			const account = {
				id: '1000',
				name: 'Account A',
			};

			const propertyOne = {
				id: 'UA-2000-1',
				name: 'Property A',
			};

			const propertyTwo = {
				id: 'UA-2001-1',
				name: 'Property B',
			};

			const profile = {
				id: '3000',
				name: 'Profile A',
			};

			dispatch( STORE_NAME ).receiveGetSettings( {} );
			dispatch( STORE_NAME ).receiveGetExistingTag( null );

			dispatch( STORE_NAME ).receiveGetAccounts( [ account ] );
			dispatch( STORE_NAME ).finishResolution( 'getAccounts', [] );

			dispatch( STORE_NAME ).receiveGetProperties( [ propertyOne, propertyTwo ], { accountID: account.id } );
			dispatch( STORE_NAME ).finishResolution( 'getProperties', [ account.id ] );

			dispatch( STORE_NAME ).receiveGetProfiles( [ profile ], { accountID: account.id, propertyID: propertyOne.id } );
			dispatch( STORE_NAME ).finishResolution( 'getProfiles', [ account.id, propertyOne.id ] );

			dispatch( STORE_NAME ).receiveGetProfiles( [], { accountID: account.id, propertyID: propertyTwo.id } );
			dispatch( STORE_NAME ).finishResolution( 'getProfiles', [ account.id, propertyTwo.id ] );
		};

		return (
			<WithTestRegistry callback={ setupRegistry }>
				<SetupWrap>
					<div className="googlesitekit-setup-module__inputs">
						<AccountSelect />
						<PropertySelect />
						<ProfileSelect />
					</div>
				</SetupWrap>
			</WithTestRegistry>
		);
	} )
	.add( 'Property Select including GA4 properties', () => {
		enabledFeatures.add( 'ga4setup' );

		const { accounts, properties, profiles } = fixtures.accountsPropertiesProfiles;
		/* eslint-disable sitekit/acronym-case */
		const accountID = properties[ 0 ].accountId;
		const propertyID = profiles[ 0 ].webPropertyId;
		/* eslint-enable */
		const setupRegistry = ( { dispatch } ) => {
			dispatch( STORE_NAME ).receiveGetAccounts( accounts );
			dispatch( STORE_NAME ).finishResolution( 'getAccounts', [] );

			// eslint-disable-next-line sitekit/acronym-case
			dispatch( STORE_NAME ).receiveGetProperties( properties, { accountID: properties[ 0 ].accountId } );
			dispatch( STORE_NAME ).receiveGetProfiles( profiles, {
				accountID,
				propertyID,
			} );

			dispatch( STORE_NAME ).receiveGetSettings( {
				accountID,
			} );
			dispatch( MODULES_ANALYTICS_4 ).receiveGetProperties(
				propertiesGA4,
				{ accountID }
			);
		};

		return (
			<WithTestRegistry
				callback={ setupRegistry }
				features={ [ 'ga4setup' ] }
			>
				<SetupWrap>
					<div className="googlesitekit-setup-module__inputs">
						<PropertySelectIncludingGA4 />
					</div>
				</SetupWrap>
			</WithTestRegistry>
		);
	} )
	.add( 'Anonymize IP switch, toggled on', () => {
		const setupRegistry = ( { dispatch } ) => {
			dispatch( STORE_NAME ).setUseSnippet( true );
			dispatch( STORE_NAME ).setAnonymizeIP( true );
		};

		return (
			<WithTestRegistry callback={ setupRegistry }>
				<SetupWrap>
					<AnonymizeIPSwitch />
				</SetupWrap>
			</WithTestRegistry>
		);
	} )
	.add( 'Anonymize IP switch, toggled off', () => {
		const setupRegistry = ( { dispatch } ) => {
			dispatch( STORE_NAME ).setUseSnippet( true );
			dispatch( STORE_NAME ).setAnonymizeIP( false );
		};

		return (
			<WithTestRegistry callback={ setupRegistry }>
				<SetupWrap>
					<AnonymizeIPSwitch />
				</SetupWrap>
			</WithTestRegistry>
		);
	} )
	.add( 'Use Snippet switch, toggled on (default)', () => {
		const setupRegistry = ( { dispatch } ) => {
			dispatch( STORE_NAME ).setUseSnippet( true );
		};

		return (
			<WithTestRegistry callback={ setupRegistry }>
				<SetupWrap>
					<UseUASnippetSwitch />
				</SetupWrap>
			</WithTestRegistry>
		);
	} )
	.add( 'Use Snippet switch, toggled off', () => {
		const setupRegistry = ( { dispatch } ) => {
			dispatch( STORE_NAME ).setUseSnippet( false );
		};

		return (
			<WithTestRegistry callback={ setupRegistry }>
				<SetupWrap>
					<UseUASnippetSwitch />
				</SetupWrap>
			</WithTestRegistry>
		);
	} )
	.add( 'Tracking exclusions (default)', () => {
		const setupRegistry = ( { dispatch } ) => {
			dispatch( STORE_NAME ).setTrackingDisabled( [ 'loggedinUsers' ] );
		};

		return (
			<WithTestRegistry callback={ setupRegistry }>
				<SetupWrap>
					<TrackingExclusionSwitches />
				</SetupWrap>
			</WithTestRegistry>
		);
	} )
	.add( 'Tracking exclusions (including loggedinUsers)', () => {
		const setupRegistry = ( { dispatch } ) => {
			dispatch( STORE_NAME ).setTrackingDisabled( [] );
		};

		return (
			<WithTestRegistry callback={ setupRegistry }>
				<SetupWrap>
					<TrackingExclusionSwitches />
				</SetupWrap>
			</WithTestRegistry>
		);
	} )
	.add( 'Tracking exclusions (including contentCreators)', () => {
		const setupRegistry = ( { dispatch } ) => {
			dispatch( STORE_NAME ).setTrackingDisabled( [ 'contentCreators' ] );
		};

		return (
			<WithTestRegistry callback={ setupRegistry }>
				<SetupWrap>
					<TrackingExclusionSwitches />
				</SetupWrap>
			</WithTestRegistry>
		);
	} )
	.add( 'GA4 notice', () => {
		return (
			<SetupWrap>
				<GA4Notice />
			</SetupWrap>
		);
	} );
