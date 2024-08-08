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
} from '../../../../../../tests/js/test-utils';
import { getWidgetComponentProps } from '../../../../googlesitekit/widgets/util';
import { CORE_USER } from '../../../../googlesitekit/datastore/user/constants';
import { CORE_MODULES } from '../../../../googlesitekit/modules/datastore/constants';
import {
	READER_REVENUE_MANAGER_MODULE_SLUG,
	READER_REVENUE_MANAGER_SETUP_BANNER_DISMISSED_KEY,
} from '../../datastore/constants';
import useActivateModuleCallback from '../../../../hooks/useActivateModuleCallback';

jest.mock( '../../../../hooks/useActivateModuleCallback' );

describe( 'ReaderRevenueManagerSetupCTABanner', () => {
	let registry;
	let activateModuleMock;

	const { Widget, WidgetNull } = getWidgetComponentProps(
		'readerRevenueManagerSetupCTABanner'
	);

	beforeEach( () => {
		registry = createTestRegistry();
		activateModuleMock = jest.fn();

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
			}
		);

		await waitForRegistry();

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
			}
		);

		await waitForRegistry();

		expect( container ).toBeEmptyDOMElement();
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
			}
		);

		await waitForRegistry();

		expect( container ).not.toBeEmptyDOMElement();

		// eslint-disable-next-line require-await
		await act( async () => {
			fireEvent.click(
				getByRole( 'button', {
					name: /Set up Reader Revenue Manager/i,
				} )
			);
		} );

		expect( activateModuleMock ).toHaveBeenCalledTimes( 1 );
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
			}
		);

		await waitForRegistry();

		fireEvent.click( getByRole( 'button', { name: /Maybe later/i } ) );

		await waitFor( () => {
			expect( fetchMock ).toHaveFetchedTimes( 1 );
		} );
	} );

	it( 'should not render the Reader Revenue Manager setup CTA banner when the module requirements does not meet', async () => {
		// Throw error from checkRequirements to simulate a module setup error.
		provideModules( registry, [
			{
				slug: READER_REVENUE_MANAGER_MODULE_SLUG,
				active: false,
				checkRequirements: () => {
					throw {
						code: 'test_error_code',
						message: 'Module setup error message',
						data: {},
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
			}
		);

		await waitForRegistry();

		expect( container ).toBeEmptyDOMElement();
	} );
} );
