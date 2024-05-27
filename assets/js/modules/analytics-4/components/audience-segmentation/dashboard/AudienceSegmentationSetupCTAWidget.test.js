/**
 * AudienceSegmentationSetupCTAWidget tests.
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
	EDIT_SCOPE,
	MODULES_ANALYTICS_4,
	AUDIENCE_SEGMENTATION_SETUP_FORM,
} from '../../../datastore/constants';
import AudienceSegmentationSetupCTAWidget from './AudienceSegmentationSetupCTAWidget';
import {
	properties as propertiesFixture,
	availableAudiences as audiencesFixture,
} from '../../../datastore/__fixtures__';

import { CORE_USER } from '../../../../../googlesitekit/datastore/user/constants';
import { CORE_FORMS } from '../../../../../googlesitekit/datastore/forms/constants';
import fetchMock from 'fetch-mock';

describe( 'AudienceSegmentationSetupCTAWidget', () => {
	let registry;

	const { Widget } = getWidgetComponentProps(
		'audienceSegmentationSetupCTA'
	);

	const syncAvailableAudiencesEndpoint = new RegExp(
		'^/google-site-kit/v1/modules/analytics-4/data/sync-audiences'
	);

	const audienceSettingsEndpoint = new RegExp(
		'^/google-site-kit/v1/modules/analytics-4/data/audience-settings'
	);

	const reportSettingsEndpoint = new RegExp(
		'^/google-site-kit/v1/modules/analytics-4/data/report'
	);

	const referenceDate = '2024-05-01';

	const reportOptions = {
		options: {
			endDate: referenceDate,
			metrics: [ { name: 'totalUsers' } ],
			startDate: '2024-01-31',
		},
	};

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

	it( 'banner is visible for no configured audiences and google analytics data loaded on the page', async () => {
		const settings = {
			configuredAudiences: [],
			isAudienceSegmentationWidgetHidden: false,
		};

		// Set the data available on page load to true.
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveIsDataAvailableOnLoad( true );

		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveSaveAudienceSettings( settings, settings );

		const { getByText, waitForRegistry } = render(
			<AudienceSegmentationSetupCTAWidget Widget={ Widget } />,
			{
				registry,
			}
		);

		// Wait for resolvers to finish to avoid an unhandled React state update.
		await waitForRegistry();

		expect(
			getByText(
				'Learn how different types of visitors interact with your site'
			)
		).toBeInTheDocument();

		expect( getByText( 'Enable groups' ) ).toBeInTheDocument();
	} );

	it( 'banner is not visible for no configured audiences and google analytics data is not loaded on the page', async () => {
		const settings = {
			configuredAudiences: [],
			isAudienceSegmentationWidgetHidden: false,
		};

		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveIsGatheringData( false );

		// Set the data available on page load to true.
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveIsDataAvailableOnLoad( false );

		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveSaveAudienceSettings( settings, settings );

		const { getByText, waitForRegistry } = render(
			<AudienceSegmentationSetupCTAWidget Widget={ Widget } />,
			{
				registry,
			}
		);

		// Wait for resolvers to finish to avoid an unhandled React state update.
		await waitForRegistry();

		expect( () =>
			getByText(
				'Learn how different types of visitors interact with your site'
			)
		).toThrow();
	} );

	it( 'banner is not visible when configured audiences present and google analytics data loaded on the page', async () => {
		const settings = {
			configuredAudiences: [
				audiencesFixture[ 0 ],
				audiencesFixture[ 1 ],
				audiencesFixture[ 2 ],
			],
			isAudienceSegmentationWidgetHidden: false,
		};

		// Set the data available on page load to true.
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveIsDataAvailableOnLoad( true );

		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveSaveAudienceSettings( settings, settings );

		const { getByText, waitForRegistry } = render(
			<AudienceSegmentationSetupCTAWidget Widget={ Widget } />,
			{
				registry,
			}
		);

		// Wait for resolvers to finish to avoid an unhandled React state update.
		await waitForRegistry();

		expect( () =>
			getByText(
				'Learn how different types of visitors interact with your site'
			)
		).toThrow();
	} );

	it( 'CTA text changes when button is clicked.', async () => {
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
			configuredAudiences: [],
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

		await dispatch( CORE_USER ).setReferenceDate( referenceDate );

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

		// Set the data available on page load to true.
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveIsDataAvailableOnLoad( true );

		const { getByText, waitForRegistry } = render(
			<AudienceSegmentationSetupCTAWidget Widget={ Widget } />,
			{
				registry,
			}
		);

		// Wait for resolvers to finish to avoid an unhandled React state update.
		await waitForRegistry();

		expect(
			getByText(
				'Learn how different types of visitors interact with your site'
			)
		).toBeInTheDocument();

		// Button text should be `Enabling groups` because we form is getting auto submitted.
		expect( getByText( 'Enabling groups' ) ).toBeInTheDocument();
	} );
} );
