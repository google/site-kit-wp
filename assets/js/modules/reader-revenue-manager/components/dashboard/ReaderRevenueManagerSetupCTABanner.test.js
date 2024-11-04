/**
 * Reader Revenue Manager Setup CTA Banner component tests.
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
import fetchMock from 'fetch-mock';

/**
 * Internal dependencies
 */
import ReaderRevenueManagerSetupCTABanner from './ReaderRevenueManagerSetupCTABanner';
import {
	act,
	render,
	createTestRegistry,
	fireEvent,
	provideModules,
	waitFor,
	provideUserAuthentication,
} from '../../../../../../tests/js/test-utils';
import { getWidgetComponentProps } from '../../../../googlesitekit/widgets/util';
import { CORE_USER } from '../../../../googlesitekit/datastore/user/constants';
import { CORE_MODULES } from '../../../../googlesitekit/modules/datastore/constants';
import {
	ERROR_CODE_NON_HTTPS_SITE,
	READER_REVENUE_MANAGER_MODULE_SLUG,
	READER_REVENUE_MANAGER_SETUP_BANNER_DISMISSED_KEY,
} from '../../datastore/constants';
import { VIEW_CONTEXT_MAIN_DASHBOARD } from '../../../../googlesitekit/constants';
import * as tracking from '../../../../util/tracking';
import useActivateModuleCallback from '../../../../hooks/useActivateModuleCallback';
import { WEEK_IN_SECONDS } from '../../../../util';
import { mockSurveyEndpoints } from '../../../../../../tests/js/mock-survey-endpoints';

const mockTrackEvent = jest.spyOn( tracking, 'trackEvent' );
mockTrackEvent.mockImplementation( () => Promise.resolve() );

jest.mock( '../../../../hooks/useActivateModuleCallback' );

describe( 'ReaderRevenueManagerSetupCTABanner', () => {
	let registry;
	let activateModuleMock;

	const { Widget, WidgetNull } = getWidgetComponentProps(
		'readerRevenueManagerSetupCTABanner'
	);

	beforeEach( () => {
		mockTrackEvent.mockClear();
		registry = createTestRegistry();
		activateModuleMock = jest.fn( () => jest.fn() );

		provideUserAuthentication( registry );

		registry.dispatch( CORE_USER ).receiveGetDismissedPrompts( [] );

		registry
			.dispatch( CORE_USER )
			.finishResolution( 'getDismissedPrompts', [] );

		provideModules( registry, [
			{
				slug: READER_REVENUE_MANAGER_MODULE_SLUG,
				active: false,
			},
		] );

		useActivateModuleCallback.mockImplementation( activateModuleMock );
	} );

	it( 'should render the Reader Revenue Manager setup CTA banner when not dismissed', async () => {
		mockSurveyEndpoints();

		const { getByText, waitForRegistry } = render(
			<ReaderRevenueManagerSetupCTABanner
				Widget={ Widget }
				WidgetNull={ WidgetNull }
			/>,
			{
				registry,
				viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
			}
		);

		await waitForRegistry();

		expect( mockTrackEvent ).toHaveBeenCalledWith(
			`${ VIEW_CONTEXT_MAIN_DASHBOARD }_rrm-setup-notification`,
			'view_notification'
		);

		expect(
			getByText( /Grow your revenue and deepen reader engagement/ )
		).toBeInTheDocument();
	} );

	it( 'should not render the Reader Revenue Manager setup CTA banner when dismissed', async () => {
		registry.dispatch( CORE_USER ).receiveGetDismissedPrompts( {
			[ READER_REVENUE_MANAGER_SETUP_BANNER_DISMISSED_KEY ]: {
				expires: Date.now() / 1000 + WEEK_IN_SECONDS,
				count: 1,
			},
		} );
		const { container, waitForRegistry } = render(
			<ReaderRevenueManagerSetupCTABanner
				Widget={ Widget }
				WidgetNull={ WidgetNull }
			/>,
			{
				registry,
				viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
			}
		);

		await waitForRegistry();

		expect( container ).toBeEmptyDOMElement();
		expect( mockTrackEvent ).not.toHaveBeenCalled();
	} );

	it( 'should call the "useActivateModuleCallback" hook when the setup CTA is clicked', async () => {
		mockSurveyEndpoints();
		registry
			.dispatch( CORE_MODULES )
			.receiveCheckRequirementsSuccess(
				READER_REVENUE_MANAGER_MODULE_SLUG
			);

		const { container, getByRole, waitForRegistry } = render(
			<ReaderRevenueManagerSetupCTABanner
				Widget={ Widget }
				WidgetNull={ WidgetNull }
			/>,
			{
				registry,
				viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
			}
		);

		await waitForRegistry();

		expect( container ).not.toBeEmptyDOMElement();

		fireEvent.click(
			getByRole( 'button', {
				name: /Set up Reader Revenue Manager/i,
			} )
		);

		expect( activateModuleMock ).toHaveBeenCalledTimes( 1 );

		expect( mockTrackEvent ).toHaveBeenNthCalledWith(
			1,
			`${ VIEW_CONTEXT_MAIN_DASHBOARD }_rrm-setup-notification`,
			'view_notification'
		);

		expect( mockTrackEvent ).toHaveBeenNthCalledWith(
			2,
			`${ VIEW_CONTEXT_MAIN_DASHBOARD }_rrm-setup-notification`,
			'confirm_notification'
		);
	} );

	it( 'should call the dismiss item endpoint when the banner is dismissed', async () => {
		mockSurveyEndpoints();

		fetchMock.postOnce(
			RegExp( '^/google-site-kit/v1/core/user/data/dismiss-prompt' ),
			{
				body: JSON.stringify( [
					READER_REVENUE_MANAGER_SETUP_BANNER_DISMISSED_KEY,
				] ),
				status: 200,
			}
		);

		const { getByRole, waitForRegistry } = render(
			<div>
				<div id="adminmenu">
					<a href="http://test.test/wp-admin/admin.php?page=googlesitekit-settings">
						Settings
					</a>
				</div>
				<ReaderRevenueManagerSetupCTABanner
					Widget={ Widget }
					WidgetNull={ WidgetNull }
				/>
			</div>,
			{
				registry,
				viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
			}
		);

		await waitForRegistry();

		// eslint-disable-next-line require-await
		await act( async () => {
			fireEvent.click( getByRole( 'button', { name: /Maybe later/i } ) );
		} );

		// 3 fetches: 1 for the survey trigger, 1 for the survey timeout, 1 for the dismiss prompt.
		expect( fetchMock ).toHaveFetchedTimes( 3 );

		expect( mockTrackEvent ).toHaveBeenNthCalledWith(
			1,
			`${ VIEW_CONTEXT_MAIN_DASHBOARD }_rrm-setup-notification`,
			'view_notification'
		);

		expect( mockTrackEvent ).toHaveBeenNthCalledWith(
			2,
			`${ VIEW_CONTEXT_MAIN_DASHBOARD }_rrm-setup-notification`,
			'dismiss_notification'
		);
	} );

	it( 'should not render the Reader Revenue Manager setup CTA banner when the module requirements do not meet', async () => {
		// Throw error from checkRequirements to simulate non-HTTPS site error.
		provideModules( registry, [
			{
				slug: READER_REVENUE_MANAGER_MODULE_SLUG,
				active: false,
				checkRequirements: () => {
					throw {
						code: ERROR_CODE_NON_HTTPS_SITE,
						message:
							'The site should use HTTPS to set up Reader Revenue Manager',
						data: null,
					};
				},
			},
		] );

		const { container, waitForRegistry } = render(
			<ReaderRevenueManagerSetupCTABanner
				Widget={ Widget }
				WidgetNull={ WidgetNull }
			/>,
			{
				registry,
				viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
			}
		);

		await waitForRegistry();

		expect( container ).toBeEmptyDOMElement();
		expect( mockTrackEvent ).not.toHaveBeenCalled();
	} );

	it( 'should not render the banner when the dismissed prompts selector is not resolved', async () => {
		registry
			.dispatch( CORE_USER )
			.startResolution( 'getDismissedPrompts', [] );

		const { container, waitForRegistry } = render(
			<ReaderRevenueManagerSetupCTABanner
				Widget={ Widget }
				WidgetNull={ WidgetNull }
			/>,
			{
				registry,
			}
		);

		await waitForRegistry();

		expect( container ).toBeEmptyDOMElement();
	} );

	it( 'should call dismiss prompt with the correct expiration time when dismissed once', async () => {
		mockSurveyEndpoints();

		fetchMock.postOnce(
			RegExp( '^/google-site-kit/v1/core/user/data/dismiss-prompt' ),
			{
				body: {
					[ READER_REVENUE_MANAGER_SETUP_BANNER_DISMISSED_KEY ]: {
						expires: 2 * WEEK_IN_SECONDS, // Expiry of 0 permanently dismisses the prompt.
						count: 1,
					},
				},
				status: 200,
			}
		);

		const { getByText, waitForRegistry } = render(
			<div>
				<div id="adminmenu">
					<a href="http://test.test/wp-admin/admin.php?page=googlesitekit-settings">
						Settings
					</a>
				</div>
				<ReaderRevenueManagerSetupCTABanner
					Widget={ Widget }
					WidgetNull={ WidgetNull }
				/>
			</div>,
			{
				registry,
			}
		);

		await waitForRegistry();

		const dismissPromptEndpoint = new RegExp(
			'^/google-site-kit/v1/core/user/data/dismiss-prompt'
		);

		act( () => {
			fireEvent.click( getByText( /Maybe later/i ) );
		} );

		await waitFor( () => {
			expect( fetchMock ).toHaveFetched( dismissPromptEndpoint, {
				body: {
					data: {
						slug: READER_REVENUE_MANAGER_SETUP_BANNER_DISMISSED_KEY,
						expiration: WEEK_IN_SECONDS * 2,
					},
				},
				method: 'POST',
			} );

			expect(
				getByText(
					/You can always enable Reader Revenue Manager from Settings later/
				)
			).toBeInTheDocument();
		} );
	} );

	it( 'should dismiss the prompt permanently when dismissed for the second time', async () => {
		mockSurveyEndpoints();

		fetchMock.postOnce(
			RegExp( '^/google-site-kit/v1/core/user/data/dismiss-prompt' ),
			{
				body: {
					[ READER_REVENUE_MANAGER_SETUP_BANNER_DISMISSED_KEY ]: {
						expires: 0, // Expiry of 0 permanently dismisses the prompt.
						count: 2,
					},
				},
				status: 200,
			}
		);

		registry.dispatch( CORE_USER ).receiveGetDismissedPrompts( {
			[ READER_REVENUE_MANAGER_SETUP_BANNER_DISMISSED_KEY ]: {
				expires: Date.now() / 1000 - 2 * WEEK_IN_SECONDS + 1,
				count: 1,
			},
		} );

		const { getByText, waitForRegistry } = render(
			<div>
				<div id="adminmenu">
					<a href="http://test.test/wp-admin/admin.php?page=googlesitekit-settings">
						Settings
					</a>
				</div>
				<ReaderRevenueManagerSetupCTABanner
					Widget={ Widget }
					WidgetNull={ WidgetNull }
				/>
			</div>,
			{
				registry,
			}
		);

		await waitForRegistry();

		const dismissPromptEndpoint = new RegExp(
			'^/google-site-kit/v1/core/user/data/dismiss-prompt'
		);

		act( () => {
			fireEvent.click( getByText( /Don’t show again/i ) );
		} );

		await waitFor( () => {
			expect( fetchMock ).toHaveFetched( dismissPromptEndpoint, {
				body: {
					data: {
						slug: READER_REVENUE_MANAGER_SETUP_BANNER_DISMISSED_KEY,
						expiration: 0,
					},
				},
				method: 'POST',
			} );
		} );
	} );
} );
