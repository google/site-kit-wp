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
	waitForTimeouts,
	untilResolved,
} from '../../../../../../../tests/js/test-utils';

import { getWidgetComponentProps } from '../../../../../googlesitekit/widgets/util';
import { EDIT_SCOPE, MODULES_ANALYTICS_4 } from '../../../datastore/constants';
import AudienceSegmentationSetupCTAWidget from './AudienceSegmentationSetupCTAWidget';
import fetchMock from 'fetch-mock';
import { CORE_USER } from '../../../../../googlesitekit/datastore/user/constants';

describe( 'AudienceSegmentationSetupCTAWidget', () => {
	let registry;

	const { Widget } = getWidgetComponentProps(
		'audienceSegmentationSetupCTA'
	);

	const audienceSettingsEndpoint = new RegExp(
		'^/google-site-kit/v1/modules/analytics-4/data/audience-settings'
	);

	const reportSettingsEndpoint = new RegExp(
		'^/google-site-kit/v1/modules/analytics-4/data/report'
	);

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
	} );

	/*it( 'banner is not rendering when configured audiences present', async () => {
		const { getByText, waitForRegistry } = render(
			<AudienceSegmentationSetupCTAWidget Widget={ Widget } />,
			{
				registry,
			}
		);

		fetchMock.get( audienceSettingsEndpoint, {
			configuredAudiences: audiencesFixture,
			isAudienceSegmentationWidgetHidden: false,
		} );

		fetchMock.get( reportSettingsEndpoint, {
			rows: 0,
		} );

		await registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveSyncAvailableAudiences( audiencesFixture );

		expect( () =>
			getByText(
				'Learn how different types of visitors interact with your site'
			)
		).toThrow();

		// Wait for resolvers to finish to avoid an unhandled React state update.
		await waitForRegistry();
	} );*/

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

		// Wait for resolvers to run.
		await waitForTimeouts( 30000 );

		const args = {
			endDate: '2024-05-01',
			metrics: [ { name: 'totalUsers' } ],
			startDate: '2024-01-31',
		};

		await dispatch( MODULES_ANALYTICS_4 ).receiveSyncAvailableAudiences(
			[]
		);

		await dispatch( CORE_USER ).setReferenceDate( '2024-05-01' );

		await dispatch( MODULES_ANALYTICS_4 ).receiveGetReport(
			{ rows: 2 },
			{
				options: args,
			}
		);

		await untilResolved( registry, MODULES_ANALYTICS_4 ).hasZeroData(
			args
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

		// Wait for resolvers to finish to avoid an unhandled React state update.
		await waitForRegistry();
	} );
} );
