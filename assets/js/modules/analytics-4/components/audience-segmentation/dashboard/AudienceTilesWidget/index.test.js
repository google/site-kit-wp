/**
 * AudienceTilesWidget component tests.
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
import AudienceTilesWidget from '.';
import { render } from '../../../../../../../../tests/js/test-utils';
import {
	createTestRegistry,
	muteFetch,
	provideModuleRegistrations,
	provideModules,
	unsubscribeFromAll,
} from '../../../../../../../../tests/js/utils';
import { getWidgetComponentProps } from '../../../../../../googlesitekit/widgets/util';
import { availableAudiences } from '../../../../datastore/__fixtures__';
import { MODULES_ANALYTICS_4 } from '../../../../datastore/constants';

describe( 'AudienceTilesWidget', () => {
	let registry;

	const { Widget, WidgetNull } = getWidgetComponentProps(
		'analyticsAudienceTiles'
	);

	const auduenceSettingsRegExp = new RegExp(
		'^/google-site-kit/v1/modules/analytics-4/data/audience-settings'
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
		provideModuleRegistrations( registry );
		registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetSettings( {} );
	} );

	afterEach( () => {
		unsubscribeFromAll( registry );
		jest.clearAllMocks();
	} );

	it( 'should not render when availableAudiences and configuredAudiences are not loaded', () => {
		muteFetch( auduenceSettingsRegExp );

		const { container } = render(
			<AudienceTilesWidget Widget={ Widget } WidgetNull={ WidgetNull } />,
			{
				registry,
			}
		);

		expect( container ).toBeEmptyDOMElement();
	} );

	it( 'should not render when availableAudiences is not loaded', () => {
		registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetAudienceSettings( {
			configuredAudiences: [ 'properties/12345/audiences/1' ],
			isAudienceSegmentationWidgetHidden: false,
		} );

		const { container } = render(
			<AudienceTilesWidget Widget={ Widget } WidgetNull={ WidgetNull } />,
			{
				registry,
			}
		);

		expect( container ).toBeEmptyDOMElement();
	} );

	it( 'should not render when configuredAudiences is not loaded', () => {
		muteFetch( auduenceSettingsRegExp );

		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.setAvailableAudiences( availableAudiences );

		const { container } = render(
			<AudienceTilesWidget Widget={ Widget } WidgetNull={ WidgetNull } />,
			{
				registry,
			}
		);

		expect( container ).toBeEmptyDOMElement();
	} );

	it( 'should not render when there is no available audience', () => {
		registry.dispatch( MODULES_ANALYTICS_4 ).setAvailableAudiences( [] );

		registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetAudienceSettings( {
			configuredAudiences: [ 'properties/12345/audiences/9' ],
			isAudienceSegmentationWidgetHidden: false,
		} );

		const { container } = render(
			<AudienceTilesWidget Widget={ Widget } WidgetNull={ WidgetNull } />,
			{
				registry,
			}
		);

		expect( container ).toBeEmptyDOMElement();
	} );

	it( 'should not render when there is no configured audience', () => {
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.setAvailableAudiences( availableAudiences );

		registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetAudienceSettings( {
			configuredAudiences: [],
			isAudienceSegmentationWidgetHidden: false,
		} );

		const { container } = render(
			<AudienceTilesWidget Widget={ Widget } WidgetNull={ WidgetNull } />,
			{
				registry,
			}
		);

		expect( container ).toBeEmptyDOMElement();
	} );

	it( 'should not render when configuredAudiences is null (not set)', () => {
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.setAvailableAudiences( availableAudiences );

		registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetAudienceSettings( {
			configuredAudiences: null,
			isAudienceSegmentationWidgetHidden: false,
		} );

		const { container } = render(
			<AudienceTilesWidget Widget={ Widget } WidgetNull={ WidgetNull } />,
			{
				registry,
			}
		);

		expect( container ).toBeEmptyDOMElement();
	} );

	it( 'should not render when there is no matching audience', () => {
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.setAvailableAudiences( availableAudiences );

		registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetAudienceSettings( {
			configuredAudiences: [ 'properties/12345/audiences/9' ],
			isAudienceSegmentationWidgetHidden: false,
		} );

		const { container } = render(
			<AudienceTilesWidget Widget={ Widget } WidgetNull={ WidgetNull } />,
			{
				registry,
			}
		);

		expect( container ).toBeEmptyDOMElement();
	} );

	it( 'should render render when configured audience is matching available audiences', async () => {
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.setAvailableAudiences( availableAudiences );

		registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetAudienceSettings( {
			configuredAudiences: [ 'properties/12345/audiences/1' ],
			isAudienceSegmentationWidgetHidden: false,
		} );

		const { container, waitForRegistry } = render(
			<AudienceTilesWidget Widget={ Widget } WidgetNull={ WidgetNull } />,
			{
				registry,
			}
		);

		await waitForRegistry();

		expect( container ).not.toBeEmptyDOMElement();
	} );

	it( 'should render when all configured audiences are matching available audiences', async () => {
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.setAvailableAudiences( availableAudiences );

		registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetAudienceSettings( {
			configuredAudiences: [
				'properties/12345/audiences/1',
				'properties/12345/audiences/3',
			],
			isAudienceSegmentationWidgetHidden: false,
		} );

		const { container, waitForRegistry } = render(
			<AudienceTilesWidget Widget={ Widget } WidgetNull={ WidgetNull } />,
			{
				registry,
			}
		);

		await waitForRegistry();

		expect( container ).not.toBeEmptyDOMElement();
	} );

	it( 'should render when some configured audiences are matching available audiences', async () => {
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.setAvailableAudiences( availableAudiences );

		registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetAudienceSettings( {
			configuredAudiences: [
				'properties/12345/audiences/1',
				'properties/12345/audiences/9',
			],
			isAudienceSegmentationWidgetHidden: false,
		} );

		const { container, waitForRegistry } = render(
			<AudienceTilesWidget Widget={ Widget } WidgetNull={ WidgetNull } />,
			{
				registry,
			}
		);

		await waitForRegistry();

		expect( container ).not.toBeEmptyDOMElement();
	} );
} );
