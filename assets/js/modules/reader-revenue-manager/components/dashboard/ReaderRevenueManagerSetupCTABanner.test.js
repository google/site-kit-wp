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
	render,
	createTestRegistry,
	fireEvent,
	provideModules,
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
import { act } from 'react-dom/test-utils';

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

		registry.dispatch( CORE_USER ).receiveGetDismissedItems( [] );

		provideModules( registry, [
			{
				slug: READER_REVENUE_MANAGER_MODULE_SLUG,
				active: false,
			},
		] );

		useActivateModuleCallback.mockImplementation( activateModuleMock );
	} );

	it( 'should render the Reader Revenue Manager setup CTA banner when not dismissed', async () => {
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
		registry
			.dispatch( CORE_USER )
			.receiveGetDismissedItems( [
				READER_REVENUE_MANAGER_SETUP_BANNER_DISMISSED_KEY,
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

	it( 'should call the "useActivateModuleCallback" hook when the setup CTA is clicked', async () => {
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
		fetchMock.postOnce(
			RegExp( '^/google-site-kit/v1/core/user/data/dismiss-item' ),
			{
				body: JSON.stringify( [
					READER_REVENUE_MANAGER_SETUP_BANNER_DISMISSED_KEY,
				] ),
				status: 200,
			}
		);

		const { getByRole, waitForRegistry } = render(
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

		// eslint-disable-next-line require-await
		await act( async () => {
			fireEvent.click( getByRole( 'button', { name: /Maybe later/i } ) );
		} );

		expect( fetchMock ).toHaveFetchedTimes( 1 );

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
} );
