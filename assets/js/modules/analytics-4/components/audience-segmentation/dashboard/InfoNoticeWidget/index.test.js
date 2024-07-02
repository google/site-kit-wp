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
 * Internal dependencies.
 */
import InfoNoticeWidget from '.';
import {
	createTestRegistry,
	fireEvent,
	provideModules,
	render,
} from '../../../../../../../../tests/js/test-utils';
import { CORE_USER } from '../../../../../../googlesitekit/datastore/user/constants';
import { withWidgetComponentProps } from '../../../../../../googlesitekit/widgets/util';
import { WEEK_IN_SECONDS } from '../../../../../../util';
import { availableAudiences } from '../../../../datastore/__fixtures__';
import { MODULES_ANALYTICS_4 } from '../../../../datastore/constants';
import { AUDIENCE_INFO_NOTICES, AUDIENCE_INFO_NOTICE_SLUG } from './constants';

describe( 'InfoNoticeWidget', () => {
	let registry;

	let dismissPromptSpy;

	beforeEach( () => {
		registry = createTestRegistry();
		provideModules( registry, [
			{
				active: true,
				connected: true,
				slug: 'analytics-4',
			},
		] );
		registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetSettings( {} );
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.setAvailableAudiences( availableAudiences );

		registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetAudienceSettings( {
			configuredAudiences: [ 'properties/12345/audiences/1' ],
			isAudienceSegmentationWidgetHidden: false,
		} );

		dismissPromptSpy = jest.spyOn(
			registry.dispatch( CORE_USER ),
			'dismissPrompt'
		);
	} );

	const WidgetWithComponentProps = withWidgetComponentProps(
		'analyticsAudienceInfoNotice'
	)( InfoNoticeWidget );

	it( 'should not render when there is no matching audience', () => {
		registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetAudienceSettings( {
			configuredAudiences: [ 'properties/12345/audiences/9' ],
			isAudienceSegmentationWidgetHidden: false,
		} );

		registry.dispatch( CORE_USER ).receiveGetDismissedPrompts( {} );

		const { container } = render( <WidgetWithComponentProps />, {
			registry,
		} );

		expect( container ).toBeEmptyDOMElement();
	} );

	it( 'should not render when permanently dismissed', async () => {
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

		const result = queryByText( AUDIENCE_INFO_NOTICES[ 0 ] );

		await waitForRegistry();

		expect( result ).not.toBeInTheDocument();
	} );

	it( 'should render when expiry has passed', async () => {
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
			AUDIENCE_INFO_NOTICES[ AUDIENCE_INFO_NOTICES.length - 1 ]
		);

		await waitForRegistry();

		expect( result ).toBeInTheDocument();
	} );

	it( 'should call the onDismiss handler with two weeks expiry until it reaches the last notice', async () => {
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

		// Ensure that dismiss prompt handler is getting called after clicking the button.
		expect( dismissPromptSpy ).toHaveBeenCalledTimes( 1 );
		expect( dismissPromptSpy ).toHaveBeenCalledWith(
			AUDIENCE_INFO_NOTICE_SLUG,
			{ expiresInSeconds: 2 * WEEK_IN_SECONDS }
		);
	} );

	it( 'should call the onDismiss handler to dismiss permanently when it reaches the last notice', async () => {
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

		// Ensure that dismiss prompt handler is getting called after clicking the button.
		expect( dismissPromptSpy ).toHaveBeenCalledTimes( 1 );
		expect( dismissPromptSpy ).toHaveBeenCalledWith(
			AUDIENCE_INFO_NOTICE_SLUG,
			{ expiresInSeconds: 0 }
		);
	} );

	it.each(
		AUDIENCE_INFO_NOTICES.map( ( notice, index ) => [ notice, index ] )
	)(
		'should render the "%s" notice when dismiss count is %d',
		async ( notice, dismissCount ) => {
			const currentTimeInSeconds = Math.floor( Date.now() / 1000 );

			registry.dispatch( CORE_USER ).receiveGetDismissedPrompts( {
				[ AUDIENCE_INFO_NOTICE_SLUG ]: {
					expires: currentTimeInSeconds - 10,
					count: dismissCount,
				},
			} );

			const { queryByText, waitForRegistry } = render(
				<WidgetWithComponentProps />,
				{
					registry,
				}
			);

			const result = queryByText( notice );

			await waitForRegistry();

			expect( result ).toBeInTheDocument();
		}
	);
} );
