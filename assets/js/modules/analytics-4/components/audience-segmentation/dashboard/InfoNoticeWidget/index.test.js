/**
 * InfoNoticeWidget tests.
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
 * External dependencies
 */
import { useIntersection as mockUseIntersection } from 'react-use';

/**
 * Internal dependencies.
 */
import InfoNoticeWidget from '.';
import {
	createTestRegistry,
	fireEvent,
	freezeFetch,
	muteFetch,
	provideModules,
	provideUserAuthentication,
	render,
	waitForDefaultTimeouts,
} from '../../../../../../../../tests/js/test-utils';
import { CORE_USER } from '../../../../../../googlesitekit/datastore/user/constants';
import { VIEW_CONTEXT_MAIN_DASHBOARD } from '../../../../../../googlesitekit/constants';
import { withWidgetComponentProps } from '../../../../../../googlesitekit/widgets/util';
import { WEEK_IN_SECONDS } from '../../../../../../util';
import * as tracking from '../../../../../../util/tracking';
import { availableAudiences } from '../../../../datastore/__fixtures__';
import { MODULES_ANALYTICS_4 } from '../../../../datastore/constants';
import { AUDIENCE_INFO_NOTICES, AUDIENCE_INFO_NOTICE_SLUG } from './constants';

jest.mock( 'react-use', () => ( {
	...jest.requireActual( 'react-use' ),
	useIntersection: jest.fn(),
} ) );

const mockTrackEvent = jest.spyOn( tracking, 'trackEvent' );
mockTrackEvent.mockImplementation( () => Promise.resolve() );

describe( 'InfoNoticeWidget', () => {
	let registry;

	let dismissPromptSpy;

	beforeEach( () => {
		mockUseIntersection.mockImplementation( () => ( {
			isIntersecting: false,
			intersectionRatio: 0,
		} ) );

		registry = createTestRegistry();
		provideModules( registry, [
			{
				active: true,
				connected: true,
				slug: 'analytics-4',
			},
		] );
		provideUserAuthentication( registry );
		registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetSettings( {} );
		dismissPromptSpy = jest.spyOn(
			registry.dispatch( CORE_USER ),
			'dismissPrompt'
		);
	} );

	afterEach( () => {
		mockTrackEvent.mockClear();
	} );

	const WidgetWithComponentProps = withWidgetComponentProps(
		'analyticsAudienceInfoNotice'
	)( InfoNoticeWidget );

	const audienceSettingsRegExp = new RegExp(
		'^/google-site-kit/v1/core/user/data/audience-settings'
	);

	const syncAudiencesRegExp = new RegExp(
		'^/google-site-kit/v1/modules/analytics-4/data/sync-audiences'
	);

	it( 'should not render when availableAudiences and configuredAudiences are not loaded', () => {
		muteFetch( audienceSettingsRegExp );

		registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetAudienceSettings( {
			availableAudiences: [],
		} );

		registry.dispatch( CORE_USER ).receiveGetDismissedPrompts( {} );

		const { container } = render( <WidgetWithComponentProps />, {
			registry,
		} );

		expect( container ).toBeEmptyDOMElement();
	} );

	it( 'should not render when availableAudiences is not loaded', () => {
		registry.dispatch( CORE_USER ).receiveGetUserAudienceSettings( {
			configuredAudiences: [ 'properties/12345/audiences/1' ],
			isAudienceSegmentationWidgetHidden: false,
		} );

		freezeFetch( syncAudiencesRegExp );

		registry.dispatch( CORE_USER ).receiveGetDismissedPrompts( {} );

		const { container } = render( <WidgetWithComponentProps />, {
			registry,
		} );

		expect( container ).toBeEmptyDOMElement();
	} );

	it( 'should not render when configuredAudiences is not loaded', () => {
		muteFetch( audienceSettingsRegExp );

		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.setAvailableAudiences( availableAudiences );

		registry.dispatch( CORE_USER ).receiveGetDismissedPrompts( {} );

		const { container } = render( <WidgetWithComponentProps />, {
			registry,
		} );

		expect( container ).toBeEmptyDOMElement();
	} );

	it( 'should not render when there is no available audience', () => {
		registry.dispatch( MODULES_ANALYTICS_4 ).setAvailableAudiences( [] );

		registry.dispatch( CORE_USER ).receiveGetUserAudienceSettings( {
			configuredAudiences: [ 'properties/12345/audiences/9' ],
			isAudienceSegmentationWidgetHidden: false,
		} );

		registry.dispatch( CORE_USER ).receiveGetDismissedPrompts( {} );

		const { container } = render( <WidgetWithComponentProps />, {
			registry,
		} );

		expect( container ).toBeEmptyDOMElement();
	} );

	it( 'should not render when there is no configured audience', () => {
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.setAvailableAudiences( availableAudiences );

		registry.dispatch( CORE_USER ).receiveGetUserAudienceSettings( {
			configuredAudiences: [],
			isAudienceSegmentationWidgetHidden: false,
		} );

		registry.dispatch( CORE_USER ).receiveGetDismissedPrompts( {} );

		const { container } = render( <WidgetWithComponentProps />, {
			registry,
		} );

		expect( container ).toBeEmptyDOMElement();
	} );

	it( 'should not render when configuredAudiences is null (not set)', () => {
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.setAvailableAudiences( availableAudiences );

		registry.dispatch( CORE_USER ).receiveGetUserAudienceSettings( {
			configuredAudiences: null,
			isAudienceSegmentationWidgetHidden: false,
		} );

		registry.dispatch( CORE_USER ).receiveGetDismissedPrompts( {} );

		const { container } = render( <WidgetWithComponentProps />, {
			registry,
		} );

		expect( container ).toBeEmptyDOMElement();
	} );

	it( 'should not render when there is no matching audience', () => {
		registry.dispatch( CORE_USER ).receiveGetUserAudienceSettings( {
			configuredAudiences: [ 'properties/12345/audiences/9' ],
			isAudienceSegmentationWidgetHidden: false,
		} );

		freezeFetch( syncAudiencesRegExp );

		registry.dispatch( CORE_USER ).receiveGetDismissedPrompts( {} );

		const { container } = render( <WidgetWithComponentProps />, {
			registry,
		} );

		expect( container ).toBeEmptyDOMElement();
	} );

	it( 'should not render when permanently dismissed', async () => {
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.setAvailableAudiences( availableAudiences );

		registry.dispatch( CORE_USER ).receiveGetUserAudienceSettings( {
			configuredAudiences: [ 'properties/12345/audiences/1' ],
			isAudienceSegmentationWidgetHidden: false,
		} );
		registry.dispatch( CORE_USER ).receiveGetDismissedPrompts( {
			[ AUDIENCE_INFO_NOTICE_SLUG ]: {
				expires: 0,
				count: AUDIENCE_INFO_NOTICES.length,
			},
		} );

		const { queryByText, waitForRegistry } = render(
			<WidgetWithComponentProps />,
			{
				registry,
			}
		);

		const result = queryByText( AUDIENCE_INFO_NOTICES[ 0 ].content );

		await waitForRegistry();

		expect( result ).not.toBeInTheDocument();
	} );

	it( 'should render when expiry has passed', async () => {
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.setAvailableAudiences( availableAudiences );

		registry.dispatch( CORE_USER ).receiveGetUserAudienceSettings( {
			configuredAudiences: [ 'properties/12345/audiences/1' ],
			isAudienceSegmentationWidgetHidden: false,
		} );

		const currentTimeInSeconds = Math.floor( Date.now() / 1000 );

		registry.dispatch( CORE_USER ).receiveGetDismissedPrompts( {
			[ AUDIENCE_INFO_NOTICE_SLUG ]: {
				expires: currentTimeInSeconds - 10,
				count: AUDIENCE_INFO_NOTICES.length - 1,
			},
		} );

		const { queryByText, waitForRegistry } = render(
			<WidgetWithComponentProps />,
			{
				registry,
			}
		);

		const result = queryByText(
			AUDIENCE_INFO_NOTICES[ AUDIENCE_INFO_NOTICES.length - 1 ].content
		);

		await waitForRegistry();

		expect( result ).toBeInTheDocument();
	} );

	it( 'should call the onDismiss handler with two weeks expiry until it reaches the last notice', async () => {
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.setAvailableAudiences( availableAudiences );

		registry.dispatch( CORE_USER ).receiveGetUserAudienceSettings( {
			configuredAudiences: [ 'properties/12345/audiences/1' ],
			isAudienceSegmentationWidgetHidden: false,
		} );

		const currentTimeInSeconds = Math.floor( Date.now() / 1000 );

		registry.dispatch( CORE_USER ).receiveGetDismissedPrompts( {
			[ AUDIENCE_INFO_NOTICE_SLUG ]: {
				expires: currentTimeInSeconds - 10,
				count: AUDIENCE_INFO_NOTICES.length - 5,
			},
		} );

		// We do not need to test anything for dismiss prompt handler.
		dismissPromptSpy.mockImplementation( jest.fn() );

		const { getByRole, waitForRegistry } = render(
			<WidgetWithComponentProps />,
			{
				registry,
			}
		);

		await waitForRegistry();

		expect(
			getByRole( 'button', { name: /Got it/i } )
		).toBeInTheDocument();

		fireEvent.click( getByRole( 'button', { name: /Got it/i } ) );

		// Allow the `trackEvent()` promise to resolve.
		await waitForDefaultTimeouts();

		// Ensure that dismiss prompt handler is getting called after clicking the button.
		expect( dismissPromptSpy ).toHaveBeenCalledTimes( 1 );
		expect( dismissPromptSpy ).toHaveBeenCalledWith(
			AUDIENCE_INFO_NOTICE_SLUG,
			{ expiresInSeconds: 2 * WEEK_IN_SECONDS }
		);
	} );

	it( 'should call the onDismiss handler to dismiss permanently when it reaches the last notice', async () => {
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.setAvailableAudiences( availableAudiences );

		registry.dispatch( CORE_USER ).receiveGetUserAudienceSettings( {
			configuredAudiences: [ 'properties/12345/audiences/1' ],
			isAudienceSegmentationWidgetHidden: false,
		} );

		const currentTimeInSeconds = Math.floor( Date.now() / 1000 );

		registry.dispatch( CORE_USER ).receiveGetDismissedPrompts( {
			[ AUDIENCE_INFO_NOTICE_SLUG ]: {
				expires: currentTimeInSeconds - 10,
				count: AUDIENCE_INFO_NOTICES.length - 1,
			},
		} );

		// We do not need to test anything for dismiss prompt handler.
		dismissPromptSpy.mockImplementation( jest.fn() );

		const { getByRole, waitForRegistry } = render(
			<WidgetWithComponentProps />,
			{
				registry,
			}
		);

		await waitForRegistry();

		expect(
			getByRole( 'button', { name: /Got it/i } )
		).toBeInTheDocument();

		fireEvent.click( getByRole( 'button', { name: /Got it/i } ) );

		// Allow the `trackEvent()` promise to resolve.
		await waitForDefaultTimeouts();

		// Ensure that dismiss prompt handler is getting called after clicking the button.
		expect( dismissPromptSpy ).toHaveBeenCalledTimes( 1 );
		expect( dismissPromptSpy ).toHaveBeenCalledWith(
			AUDIENCE_INFO_NOTICE_SLUG,
			{ expiresInSeconds: 0 }
		);
	} );

	describe.each(
		AUDIENCE_INFO_NOTICES.map( ( { content, slug }, index ) => [
			content,
			index,
			slug,
		] )
	)(
		'for the "%s" notice, when dismiss count is %d',
		( content, dismissCount, slug ) => {
			let getByText, getByRole, rerender;

			beforeEach( () => {
				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.setAvailableAudiences( availableAudiences );

				registry.dispatch( CORE_USER ).receiveGetUserAudienceSettings( {
					configuredAudiences: [ 'properties/12345/audiences/1' ],
					isAudienceSegmentationWidgetHidden: false,
				} );

				const currentTimeInSeconds = Math.floor( Date.now() / 1000 );

				registry.dispatch( CORE_USER ).receiveGetDismissedPrompts( {
					[ AUDIENCE_INFO_NOTICE_SLUG ]: {
						expires: currentTimeInSeconds - 10,
						count: dismissCount,
					},
				} );

				( { getByRole, getByText, rerender } = render(
					<WidgetWithComponentProps />,
					{
						registry,
						viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
					}
				) );
			} );

			it( 'should render the notice', () => {
				expect( getByText( content ) ).toBeInTheDocument();
			} );

			it( 'should track an event when the notice is viewed', () => {
				expect( mockTrackEvent ).toHaveBeenCalledTimes( 0 );

				// Simulate the CTA becoming visible.
				mockUseIntersection.mockImplementation( () => ( {
					isIntersecting: true,
					intersectionRatio: 1,
				} ) );

				rerender( <WidgetWithComponentProps /> );

				expect( mockTrackEvent ).toHaveBeenCalledTimes( 1 );
				expect( mockTrackEvent ).toHaveBeenCalledWith(
					'mainDashboard_audiences-info-notice',
					'view_notice',
					slug
				);
			} );

			it( 'should track an event when the notice is dismissed', async () => {
				// We do not need to test anything for dismiss prompt handler.
				dismissPromptSpy.mockImplementation( jest.fn() );

				fireEvent.click( getByRole( 'button', { name: /Got it/i } ) );

				// Allow the `trackEvent()` promise to resolve.
				await waitForDefaultTimeouts();

				expect( mockTrackEvent ).toHaveBeenCalledTimes( 1 );
				expect( mockTrackEvent ).toHaveBeenCalledWith(
					'mainDashboard_audiences-info-notice',
					'dismiss_notice',
					slug
				);
			} );
		}
	);
} );
