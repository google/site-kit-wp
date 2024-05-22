/**
 * KeyMetricsSetupCTAWidget tests.
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

import {
	render,
	createTestRegistry,
	provideModules,
	provideModuleRegistrations,
	provideUserInfo,
	provideUserAuthentication,
	provideSiteInfo,
} from '../../../../../../../tests/js/test-utils';

import { getWidgetComponentProps } from '../../../../../googlesitekit/widgets/util';
import {
	AUDIENCE_SEGMENTATION_SETUP_FORM,
	EDIT_SCOPE,
	MODULES_ANALYTICS_4,
} from '../../../datastore/constants';
import AudienceSegmentationSetupCTAWidget from './AudienceSegmentationSetupCTAWidget';
import fetchMock from 'fetch-mock';
import {
	availableAudiences as audiencesFixture,
	properties as propertiesFixture,
} from '../../../datastore/__fixtures__';
import { CORE_USER } from '../../../../../googlesitekit/datastore/user/constants';
import { CORE_FORMS } from '../../../../../googlesitekit/datastore/forms/constants';

describe( 'AudienceSegmentationSetupCTAWidget', () => {
	let registry;

	const referenceDate = '2024-05-01';

	const reportOptions = {
		options: {
			endDate: referenceDate,
			metrics: [ { name: 'totalUsers' } ],
			startDate: '2024-01-31',
		},
	};

	const { Widget } = getWidgetComponentProps(
		'audienceSegmentationSetupCTA'
	);

	const audienceSettingsEndpoint = new RegExp(
		'^/google-site-kit/v1/modules/analytics-4/data/audience-settings'
	);

	const syncAvailableAudiencesEndpoint = new RegExp(
		'^/google-site-kit/v1/modules/analytics-4/data/sync-audiences'
	);

	const reportSettingsEndpoint = new RegExp(
		'^/google-site-kit/v1/modules/analytics-4/data/report'
	);

	const testPropertyID = propertiesFixture[ 0 ]._id;

	beforeEach( () => {
		registry = createTestRegistry();
		provideModules( registry, [
			{
				active: true,
				connected: true,
				slug: 'analytics-4',
			},
		] );
		provideSiteInfo( registry );
		provideModuleRegistrations( registry );
		provideUserInfo( registry );
		provideUserAuthentication( registry, {
			grantedScopes: [ EDIT_SCOPE ],
		} );
		registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetSettings( {} );

		registry.dispatch( MODULES_ANALYTICS_4 ).setSettings( {
			availableAudiences: null,
			// Assume the required custom dimension is available for most tests. Its creation is tested in its own subsection.
			availableCustomDimensions: [ 'googlesitekit_post_type' ],
			propertyID: testPropertyID,
		} );
	} );

	it( 'banner is not rendering when configured audiences present', async () => {
		fetchMock.get( audienceSettingsEndpoint, {
			configuredAudiences: audiencesFixture,
			isAudienceSegmentationWidgetHidden: false,
		} );

		fetchMock.get( reportSettingsEndpoint, {
			status: 200,
			body: {
				rows: [],
			},
		} );

		await registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveSyncAvailableAudiences( audiencesFixture );

		const { getByText, waitForRegistry } = render(
			<AudienceSegmentationSetupCTAWidget Widget={ Widget } />,
			{
				registry,
			}
		);

		expect( () =>
			getByText(
				'Learn how different types of visitors interact with your site'
			)
		).toThrow();

		// Wait for resolvers to finish to avoid an unhandled React state update.
		await waitForRegistry();
	} );

	it( 'banner is rendering when no configured audiences and past data exists', async () => {
		const { dispatch } = registry;

		fetchMock.get( audienceSettingsEndpoint, {
			configuredAudiences: [],
			isAudienceSegmentationWidgetHidden: false,
		} );

		fetchMock.get( reportSettingsEndpoint, {
			status: 200,
			body: {
				rows: 2,
			},
		} );

		const report = {
			rows: 2,
			totals: [
				{
					metricValues: [
						{
							value: 2,
						},
					],
				},
			],
		};

		await dispatch( MODULES_ANALYTICS_4 ).receiveSyncAvailableAudiences(
			[]
		);

		await dispatch( CORE_USER ).setReferenceDate( '2024-05-01' );

		await dispatch( MODULES_ANALYTICS_4 ).receiveGetReport(
			report,
			reportOptions
		);

		await dispatch( MODULES_ANALYTICS_4 ).finishResolution( 'getReport', [
			reportOptions.options,
		] );

		const { getByText, waitForRegistry } = render(
			<AudienceSegmentationSetupCTAWidget Widget={ Widget } />,
			{
				registry,
			}
		);

		expect(
			getByText(
				'Learn how different types of visitors interact with your site'
			)
		).toBeInTheDocument();

		// Wait for resolvers to finish to avoid an unhandled React state update.
		await waitForRegistry();
	} );

	it( 'banner is rendering with loading spinner button when autosubmit is true', async () => {
		const { dispatch } = registry;

		const report = {
			rows: [
				{
					metricValues: [
						{
							value: 2,
						},
					],
				},
				{
					metricValues: [
						{
							value: 2,
						},
					],
				},
			],
			totals: [
				{
					metricValues: [
						{
							value: 2,
						},
					],
				},
			],
		};

		fetchMock.get( audienceSettingsEndpoint, {
			configuredAudiences: audiencesFixture,
			isAudienceSegmentationWidgetHidden: false,
		} );

		fetchMock.get( reportSettingsEndpoint, {
			status: 200,
			body: report,
		} );

		fetchMock.post( syncAvailableAudiencesEndpoint, {
			status: 200,
			body: audiencesFixture,
		} );

		fetchMock.postOnce( audienceSettingsEndpoint, {
			status: 200,
			body: audiencesFixture,
		} );

		await dispatch( MODULES_ANALYTICS_4 ).receiveSyncAvailableAudiences(
			audiencesFixture
		);

		await dispatch( CORE_USER ).setReferenceDate( '2024-05-01' );

		await dispatch( MODULES_ANALYTICS_4 ).receiveGetReport(
			report,
			reportOptions
		);

		await dispatch( MODULES_ANALYTICS_4 ).finishResolution( 'getReport', [
			reportOptions.options,
		] );

		// Set the autoSubmit to true.
		await dispatch( CORE_FORMS ).setValues(
			AUDIENCE_SEGMENTATION_SETUP_FORM,
			{ autoSubmit: true }
		);

		const { getByText, waitForRegistry } = render(
			<AudienceSegmentationSetupCTAWidget Widget={ Widget } />,
			{
				registry,
			}
		);

		expect(
			getByText(
				'Learn how different types of visitors interact with your site'
			)
		).toBeInTheDocument();

		expect( getByText( 'Enabling groups' ) ).toBeInTheDocument();

		// Wait for resolvers to finish to avoid an unhandled React state update.
		await waitForRegistry();
	} );
} );
