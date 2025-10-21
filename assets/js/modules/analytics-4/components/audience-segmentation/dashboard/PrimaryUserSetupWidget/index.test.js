/**
 * PrimaryUserSetupWidget component tests.
 *
 * Site Kit by Google, Copyright 2025 Google LLC
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
import PrimaryUserSetupWidget from '.';
import { render, waitFor } from '../../../../../../../../tests/js/test-utils';
import {
	createTestRegistry,
	provideModules,
	freezeFetch,
	provideUserAuthentication,
	provideModuleRegistrations,
} from '../../../../../../../../tests/js/utils';
import { withWidgetComponentProps } from '@/js/googlesitekit/widgets/util';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import {
	EDIT_SCOPE,
	MODULES_ANALYTICS_4,
} from '@/js/modules/analytics-4/datastore/constants';
import { MODULE_SLUG_ANALYTICS_4 } from '@/js/modules/analytics-4/constants';
import { availableAudiences } from '@/js/modules/analytics-4/datastore/__fixtures__';
import { ERROR_REASON_INSUFFICIENT_PERMISSIONS } from '@/js/util/errors';

const syncAvailableCustomDimensionsEndpoint = new RegExp(
	'^/google-site-kit/v1/modules/analytics-4/data/sync-custom-dimensions'
);

const syncAvailableAudiencesEndpoint = new RegExp(
	'^/google-site-kit/v1/modules/analytics-4/data/sync-audiences'
);

const createAudienceEndpoint = new RegExp(
	'^/google-site-kit/v1/modules/analytics-4/data/create-audience'
);

const WidgetWithComponentProps = withWidgetComponentProps(
	'keyMetricsAddMetric'
)( PrimaryUserSetupWidget );

describe( 'PrimaryUserSetupWidget', () => {
	let registry;

	beforeEach( () => {
		registry = createTestRegistry();

		provideUserAuthentication( registry, {
			grantedScopes: EDIT_SCOPE,
		} );

		registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetSettings( {
			accountID: '12345',
			propertyID: '34567',
			measurementID: '56789',
			webDataStreamID: '78901',
			availableCustomDimensions: [],
		} );

		const audienceSettings = {
			configuredAudiences: [],
			isAudienceSegmentationWidgetHidden: false,
		};

		registry
			.dispatch( CORE_USER )
			.receiveGetUserAudienceSettings( audienceSettings );

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

	it( 'should start audiences creation on mount', async () => {
		freezeFetch( syncAvailableAudiencesEndpoint );

		const { container } = render( <WidgetWithComponentProps />, {
			registry,
		} );

		await waitFor( () =>
			expect(
				container.querySelectorAll(
					'.googlesitekit-audience-segmentation-tile-loading'
				)
			).toHaveLength( 2 )
		);

		await waitFor( () =>
			expect( fetchMock ).toHaveFetched( syncAvailableAudiencesEndpoint )
		);

		expect( container ).toMatchSnapshot();
	} );

	it( 'should handle generic errors and diplay a retry button', async () => {
		fetchMock.post( syncAvailableAudiencesEndpoint, {
			body: {
				code: 'test_error',
				message: 'Error message.',
			},
			status: 500,
		} );

		const { container, getByText } = render( <WidgetWithComponentProps />, {
			registry,
		} );

		await waitFor( () => {
			expect(
				getByText( 'Your visitor groups data loading failed' )
			).toBeInTheDocument();
			expect( getByText( 'Retry' ) ).toBeInTheDocument();
		} );

		expect( container ).toMatchSnapshot();
	} );

	it( 'should display the audiences that failed to be created', async () => {
		fetchMock.post( syncAvailableCustomDimensionsEndpoint, {
			body: [],
			status: 200,
		} );

		fetchMock.post( syncAvailableAudiencesEndpoint, {
			body: availableAudiences.slice( 0, 2 ),
			status: 200,
		} );

		fetchMock.post( createAudienceEndpoint, {
			body: {
				code: 'test_error',
				message: 'Error message.',
				data: { status: 500 },
			},
			status: 500,
		} );

		const { container, getByText } = render( <WidgetWithComponentProps />, {
			registry,
		} );

		await waitFor( () => {
			expect(
				getByText( 'Failed to create the following audiences:' )
			).toBeInTheDocument();
			expect( getByText( 'Retry' ) ).toBeInTheDocument();
			expect( getByText( 'new-visitors' ) ).toBeInTheDocument();
			expect( getByText( 'returning-visitors' ) ).toBeInTheDocument();
		} );

		expect( container ).toMatchSnapshot();
	} );

	it( 'should handle the insufficient permissions error', async () => {
		fetchMock.post( syncAvailableAudiencesEndpoint, {
			body: {
				code: 'test_error',
				message: 'Error message.',
				data: { reason: ERROR_REASON_INSUFFICIENT_PERMISSIONS },
			},
			status: 403,
		} );

		const { container, queryByText, getByText } = render(
			<WidgetWithComponentProps />,
			{
				registry,
			}
		);

		await waitFor( () => {
			expect(
				getByText( 'Insufficient permissions' )
			).toBeInTheDocument();
			expect( queryByText( 'Retry' ) ).not.toBeInTheDocument();
		} );

		expect( container ).toMatchSnapshot();
	} );
} );
