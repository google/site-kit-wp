/**
 * NoAudienceBannerWidget component tests.
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
import NoAudienceBannerWidget from '.';
import { render } from '../../../../../../../../tests/js/test-utils';
import {
	createTestRegistry,
	muteFetch,
	provideModuleRegistrations,
	provideModules,
	unsubscribeFromAll,
} from '../../../../../../../../tests/js/utils';
import { getWidgetComponentProps } from '../../../../../../googlesitekit/widgets/util';
import { MODULES_ANALYTICS_4 } from '../../../../datastore/constants';
import { availableAudiences } from '../../../../datastore/__fixtures__';

describe( 'NoAudienceBannerWidget', () => {
	let registry;

	const { Widget, WidgetNull } = getWidgetComponentProps(
		'analyticsNoAudienceBanner'
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
			<NoAudienceBannerWidget
				Widget={ Widget }
				WidgetNull={ WidgetNull }
			/>,
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
			<NoAudienceBannerWidget
				Widget={ Widget }
				WidgetNull={ WidgetNull }
			/>,
			{
				registry,
			}
		);

		expect( container ).toBeEmptyDOMElement();
	} );

	it( 'should not render when configured audience is matching available audiences', () => {
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.setAvailableAudiences( availableAudiences );

		registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetAudienceSettings( {
			configuredAudiences: [ 'properties/12345/audiences/1' ],
			isAudienceSegmentationWidgetHidden: false,
		} );

		const { container } = render(
			<NoAudienceBannerWidget
				Widget={ Widget }
				WidgetNull={ WidgetNull }
			/>,
			{
				registry,
			}
		);

		expect( container ).toBeEmptyDOMElement();
	} );

	it( 'should not render when all configured audiences are matching available audiences', () => {
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

		const { container } = render(
			<NoAudienceBannerWidget
				Widget={ Widget }
				WidgetNull={ WidgetNull }
			/>,
			{
				registry,
			}
		);

		expect( container ).toBeEmptyDOMElement();
	} );

	it( 'should not render when some configured audiences are matching available audiences', () => {
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

		const { container } = render(
			<NoAudienceBannerWidget
				Widget={ Widget }
				WidgetNull={ WidgetNull }
			/>,
			{
				registry,
			}
		);

		expect( container ).toBeEmptyDOMElement();
	} );

	it( 'should render with correct message when there are additional configurable audiences available', () => {
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.setAvailableAudiences( availableAudiences );

		registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetAudienceSettings( {
			configuredAudiences: [ 'properties/12345/audiences/9' ],
			isAudienceSegmentationWidgetHidden: false,
		} );

		const { container, getByText } = render(
			<NoAudienceBannerWidget
				Widget={ Widget }
				WidgetNull={ WidgetNull }
			/>,
			{
				registry,
			}
		);

		expect(
			container.querySelector( '.googlesitekit-no-audience-banner' )
		).toBeInTheDocument();

		expect( getByText( /Select other groups/i ) ).toBeInTheDocument();

		expect( container ).toMatchSnapshot();
	} );

	it( 'should render with correct message when there is no additional configurable audience available', () => {
		registry.dispatch( MODULES_ANALYTICS_4 ).setAvailableAudiences( [] );

		registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetAudienceSettings( {
			configuredAudiences: [ 'properties/12345/audiences/9' ],
			isAudienceSegmentationWidgetHidden: false,
		} );

		const { container, getByText } = render(
			<NoAudienceBannerWidget
				Widget={ Widget }
				WidgetNull={ WidgetNull }
			/>,
			{
				registry,
			}
		);

		expect(
			container.querySelector( '.googlesitekit-no-audience-banner' )
		).toBeInTheDocument();

		expect(
			getByText( /Learn more about how to group site visitors in/i )
		).toBeInTheDocument();

		expect( container ).toMatchSnapshot();
	} );
} );
