/**
 * SecondaryUserSetupWidget component tests.
 *
 * Site Kit by Google, Copyright 2026 Google LLC
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
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import { withWidgetComponentProps } from '@/js/googlesitekit/widgets/util';
import { AUDIENCE_SEGMENTATION_SETUP_DISMISSED_SLUG } from '@/js/modules/analytics-4/components/audience-segmentation/dashboard/AudienceSelectionPanel/constants';
import { MODULE_SLUG_ANALYTICS_4 } from '@/js/modules/analytics-4/constants';
import { MODULES_ANALYTICS_4 } from '@/js/modules/analytics-4/datastore/constants';
import { fireEvent, render, waitFor } from '@tests/js/test-utils';
import {
	createTestRegistry,
	provideModuleRegistrations,
	provideModules,
	provideSiteInfo,
} from '@tests/js/utils';
import SecondaryUserSetupWidget from '.';

const syncAvailableAudiencesEndpoint = new RegExp(
	'^/google-site-kit/v1/modules/analytics-4/data/sync-audiences'
);

const dismissItemEndpoint = new RegExp(
	'^/google-site-kit/v1/core/user/data/dismiss-item'
);

const WidgetWithComponentProps = withWidgetComponentProps(
	'analyticsAudienceSecondaryUserSetup'
)( SecondaryUserSetupWidget );

describe( 'SecondaryUserSetupWidget', () => {
	let registry;

	beforeEach( () => {
		registry = createTestRegistry();

		provideSiteInfo( registry );

		registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetSettings( {
			accountID: '12345',
			propertyID: '34567',
			measurementID: '56789',
			webDataStreamID: '78901',
			availableCustomDimensions: [],
		} );

		const audienceSettings = {
			configuredAudiences: null,
			isAudienceSegmentationWidgetHidden: false,
		};

		registry
			.dispatch( CORE_USER )
			.receiveGetUserAudienceSettings( audienceSettings );
		registry.dispatch( CORE_USER ).receiveGetDismissedItems( [] );

		provideModules( registry, [
			{
				active: true,
				connected: true,
				slug: MODULE_SLUG_ANALYTICS_4,
			},
		] );
		provideModuleRegistrations( registry );
	} );

	afterEach( () => {
		jest.clearAllMocks();
	} );

	it( 'should render the setup error widget when setupFlowRefreshPhase4 is enabled', async () => {
		fetchMock.post( syncAvailableAudiencesEndpoint, {
			body: {
				code: 'test_error',
				message: 'Error message.',
				data: { status: 500 },
			},
			status: 500,
		} );

		fetchMock.post( dismissItemEndpoint, {
			body: [ AUDIENCE_SEGMENTATION_SETUP_DISMISSED_SLUG ],
			status: 200,
		} );

		const { getByRole, getByText } = render( <WidgetWithComponentProps />, {
			registry,
			features: [ 'setupFlowRefreshPhase4' ],
		} );

		await waitFor( () => {
			expect(
				getByText( 'Visitor groups setup failed' )
			).toBeInTheDocument();
			expect(
				getByRole( 'button', { name: 'Retry' } )
			).toBeInTheDocument();
			expect(
				getByRole( 'button', { name: 'No thanks' } )
			).toBeInTheDocument();
		} );

		fireEvent.click( getByRole( 'button', { name: 'No thanks' } ) );

		await waitFor( () => {
			expect( fetchMock ).toHaveFetched( dismissItemEndpoint );
			expect(
				registry
					.select( CORE_USER )
					.isItemDismissed(
						AUDIENCE_SEGMENTATION_SETUP_DISMISSED_SLUG
					)
			).toBe( true );
		} );
	} );
} );
