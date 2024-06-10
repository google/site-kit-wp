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
import {
	render,
	provideModules,
	createTestRegistry,
	fireEvent,
} from '../../../../../../../../tests/js/test-utils';
import { withWidgetComponentProps } from '../../../../../../googlesitekit/widgets/util';
import { AUDIENCE_INFO_NOTICE_SLUG, AUDIENCE_INFO_NOTICES } from './constants';
import { CORE_USER } from '../../../../../../googlesitekit/datastore/user/constants';
import { WEEK_IN_SECONDS } from '../../../../../../util';
import InfoNoticeWidget from '.';

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

		dismissPromptSpy = jest.spyOn(
			registry.dispatch( CORE_USER ),
			'dismissPrompt'
		);
	} );

	const WidgetWithComponentProps =
		withWidgetComponentProps( 'InfoNoticeWidget' )( InfoNoticeWidget );

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

		const result = queryByText(
			'The higher the portion of new visitors you have, the more your audience is growing. Looking at what content brings them to your site may give you insights on how to reach even more people.'
		);

		await waitForRegistry();

		expect( result ).not.toBeInTheDocument();
	} );

	it( 'should render when expiry has passed', async () => {
		const currentTimeInSeconds = Math.floor( Date.now() / 1000 );

		registry.dispatch( CORE_USER ).receiveGetDismissedPrompts( {
			[ AUDIENCE_INFO_NOTICE_SLUG ]: {
				expires: currentTimeInSeconds - 10,
				count: 2,
			},
		} );

		const { queryByText, waitForRegistry } = render(
			<WidgetWithComponentProps />,
			{
				registry,
			}
		);

		const result = queryByText(
			'Configure your own custom audiences in Analytics to gain deeper insights into visitor behavior, for example consider creating a “Existing customers” or “Subscribers” segment, depending on what goals you have for your site.'
		);

		await waitForRegistry();

		expect( result ).toBeInTheDocument();
	} );

	it( 'should call the onDismiss handler with two weeks expiry when dismiss count is less than 6', async () => {
		const currentTimeInSeconds = Math.floor( Date.now() / 1000 );

		registry.dispatch( CORE_USER ).receiveGetDismissedPrompts( {
			[ AUDIENCE_INFO_NOTICE_SLUG ]: {
				expires: currentTimeInSeconds - 10,
				count: 2,
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

	it( 'should call the onDismiss handler to dismiss permanently when dismiss count is 6', async () => {
		const currentTimeInSeconds = Math.floor( Date.now() / 1000 );

		registry.dispatch( CORE_USER ).receiveGetDismissedPrompts( {
			[ AUDIENCE_INFO_NOTICE_SLUG ]: {
				expires: currentTimeInSeconds - 10,
				count: 6,
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
