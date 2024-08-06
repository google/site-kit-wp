/**
 * SettingsCardVisitorGroups SetupCTA component tests.
 *
 * Site Kit by Google, Copyright 2024 Google LLC
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
 * Internal dependencies
 */
import { availableAudiences as audiencesFixture } from '../../../../datastore/__fixtures__';
import {
	createTestRegistry,
	fireEvent,
	freezeFetch,
	muteFetch,
	provideModules,
	provideUserAuthentication,
	render,
} from '../../../../../../../../tests/js/test-utils';
import { AUDIENCE_SEGMENTATION_SETUP_CTA_NOTIFICATION } from '../../dashboard/AudienceSegmentationSetupCTAWidget';
import { CORE_USER } from '../../../../../../googlesitekit/datastore/user/constants';
import {
	EDIT_SCOPE,
	MODULES_ANALYTICS_4,
} from '../../../../datastore/constants';
import SetupCTA from './SetupCTA';

describe( 'SettingsCardVisitorGroups SetupCTA', () => {
	let registry;

	const audienceSettingsEndpoint = new RegExp(
		'^/google-site-kit/v1/core/user/data/audience-settings'
	);
	const reportEndpoint = new RegExp(
		'^/google-site-kit/v1/modules/analytics-4/data/report'
	);
	const syncAvailableAudiencesEndpoint = new RegExp(
		'^/google-site-kit/v1/modules/analytics-4/data/sync-audiences'
	);

	beforeEach( () => {
		registry = createTestRegistry();

		provideUserAuthentication( registry, {
			grantedScopes: [ EDIT_SCOPE ],
		} );

		provideModules( registry, [
			{
				slug: 'analytics-4',
				active: true,
				connected: true,
			},
		] );

		registry.dispatch( CORE_USER ).receiveGetDismissedPrompts( [] );

		registry.dispatch( MODULES_ANALYTICS_4 ).setSettings( {
			availableAudiences: null,
			availableCustomDimensions: [ 'googlesitekit_post_type' ],
			propertyID: '123456789',
		} );

		registry.dispatch( CORE_USER ).receiveGetAudienceSettings( {
			configuredAudiences: null,
			isAudienceSegmentationWidgetHidden: false,
		} );
	} );

	it( 'should render the setup CTA', () => {
		const { getByText, getByRole } = render( <SetupCTA />, { registry } );

		expect(
			getByText(
				'To set up new visitor groups for your site, Site Kit needs to update your Google Analytics property.'
			)
		).toBeInTheDocument();

		expect(
			getByRole( 'button', { name: /Enable groups/i } )
		).toBeInTheDocument();
	} );

	it( 'should not render the setup CTA if dismissed', () => {
		registry.dispatch( CORE_USER ).receiveGetDismissedPrompts( {
			[ AUDIENCE_SEGMENTATION_SETUP_CTA_NOTIFICATION ]: {
				expires: 0,
				count: 1,
			},
		} );

		const { queryByText, queryByRole } = render( <SetupCTA />, {
			registry,
		} );

		expect(
			queryByText(
				'To set up new visitor groups for your site, Site Kit needs to update your Google Analytics property.'
			)
		).not.toBeInTheDocument();

		expect(
			queryByRole( 'button', { name: /Enable groups/i } )
		).not.toBeInTheDocument();
	} );

	it( 'should show in progress state when enabling groups', () => {
		freezeFetch( syncAvailableAudiencesEndpoint );

		const { getByText, getByRole } = render( <SetupCTA />, { registry } );

		fireEvent.click( getByRole( 'button', { name: /Enable groups/i } ) );

		expect( getByText( 'Enabling groups' ) ).toBeInTheDocument();
	} );

	it( 'should initialize the list of configured audiences when the CTA is clicked', () => {
		fetchMock.postOnce( syncAvailableAudiencesEndpoint, {
			status: 200,
			body: audiencesFixture,
		} );

		fetchMock.postOnce( audienceSettingsEndpoint, {
			status: 200,
			body: {
				configuredAudiences: [
					audiencesFixture[ 3 ].name,
					audiencesFixture[ 4 ].name,
				],
				isAudienceSegmentationWidgetHidden: false,
			},
		} );

		muteFetch( reportEndpoint );

		const { getByText, getByRole } = render( <SetupCTA />, { registry } );

		expect(
			getByRole( 'button', { name: /Enable groups/i } )
		).toBeInTheDocument();

		fireEvent.click( getByRole( 'button', { name: /Enable groups/i } ) );

		expect( getByText( 'Enabling groups' ) ).toBeInTheDocument();
		expect( fetchMock ).toHaveFetched( syncAvailableAudiencesEndpoint );
	} );
} );
