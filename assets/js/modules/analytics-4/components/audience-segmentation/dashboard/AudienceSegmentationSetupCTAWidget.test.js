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
import { EDIT_SCOPE, MODULES_ANALYTICS_4 } from '../../../datastore/constants';
import AudienceSegmentationSetupCTAWidget from './AudienceSegmentationSetupCTAWidget';
import {
	properties as propertiesFixture,
	availableAudiences as audiencesFixture,
} from '../../../datastore/__fixtures__';

describe( 'AudienceSegmentationSetupCTAWidget', () => {
	let registry;

	const { Widget } = getWidgetComponentProps(
		'audienceSegmentationSetupCTA'
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
} );
