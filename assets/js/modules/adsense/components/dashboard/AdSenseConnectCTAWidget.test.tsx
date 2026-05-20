/**
 * AdSenseConnectCTAWidget component tests.
 *
 * Site Kit by Google, Copyright 2021 Google LLC
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
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import { withActive } from '@/js/googlesitekit/modules/datastore/__fixtures__';
import { CORE_MODULES } from '@/js/googlesitekit/modules/datastore/constants';
import { DISMISS_TRANSITION_MS } from '@/js/googlesitekit/widgets/components/WidgetDismissTransition';
import { withWidgetComponentProps } from '@/js/googlesitekit/widgets/util';
import {
	ADSENSE_CTA_WIDGET_DISMISSED_ITEM_KEY,
	MODULE_SLUG_ADSENSE,
} from '@/js/modules/adsense/constants';
import { MODULES_ADSENSE } from '@/js/modules/adsense/datastore/constants';
import {
	act,
	createTestRegistry,
	fireEvent,
	provideSiteInfo,
	provideUserAuthentication,
	render,
} from '../../../../../../tests/js/test-utils';
import AdSenseConnectCTAWidget from './AdSenseConnectCTAWidget';

const mockShowTooltip = jest.fn();
jest.mock( '../../../../components/AdminScreenTooltip', () => ( {
	__esModule: true,
	default: jest.fn(),
	useShowTooltip: jest.fn( () => mockShowTooltip ),
} ) );

describe( 'AdSenseConnectCTAWidget', () => {
	let registry: ReturnType< typeof createTestRegistry >;

	const WidgetWithComponentProps = withWidgetComponentProps(
		'adsenseConnectCTA'
	)( AdSenseConnectCTAWidget );

	beforeEach( () => {
		registry = createTestRegistry();
		registry.dispatch( MODULES_ADSENSE ).setSettings( {} );
		provideSiteInfo( registry );
		provideUserAuthentication( registry );
		registry
			.dispatch( CORE_MODULES )
			.receiveGetModules( withActive( MODULE_SLUG_ADSENSE ) );
		registry.dispatch( CORE_USER ).receiveGetDismissedItems( [] );
	} );

	function renderWidget() {
		return render(
			<div>
				<div id="adminmenu">
					<a href="http://test.test/wp-admin/admin.php?page=googlesitekit-settings">
						Settings
					</a>
				</div>
				<WidgetWithComponentProps />
			</div>,
			{ registry }
		);
	}

	describe( 'after clicking "Maybe later"', () => {
		beforeEach( () => {
			fetchMock.postOnce(
				new RegExp(
					'^/google-site-kit/v1/core/user/data/dismiss-item'
				),
				{
					body: JSON.stringify( [
						ADSENSE_CTA_WIDGET_DISMISSED_ITEM_KEY,
					] ),
					status: 200,
				}
			);
		} );

		it( 'opens the tooltip', async () => {
			const { getByRole } = renderWidget();

			// eslint-disable-next-line require-await
			await act( async () => {
				fireEvent.click(
					getByRole( 'button', { name: /maybe later/i } )
				);
			} );

			expect( mockShowTooltip ).toHaveBeenCalled();
		} );

		it( 'does not unmount the widget immediately', async () => {
			const { getByRole, container } = renderWidget();

			// eslint-disable-next-line require-await
			await act( async () => {
				fireEvent.click(
					getByRole( 'button', { name: /maybe later/i } )
				);
			} );

			// AdSenseConnectCTA content should still be present.
			expect(
				container.querySelector( '.googlesitekit-setup__wrapper' )
			).not.toBeNull();
		} );

		it( 'applies the dismissing class to the transition wrapper', async () => {
			const { getByRole, container } = renderWidget();

			// eslint-disable-next-line require-await
			await act( async () => {
				fireEvent.click(
					getByRole( 'button', { name: /maybe later/i } )
				);
			} );

			expect(
				container.querySelector(
					'.googlesitekit-widget-dismiss-transition--dismissing'
				)
			).not.toBeNull();
		} );

		it( 'disables the "Maybe later" button while isDismissingItem is true', () => {
			registry
				.dispatch( CORE_USER )
				.setIsItemDimissing(
					ADSENSE_CTA_WIDGET_DISMISSED_ITEM_KEY,
					true
				);

			const { getByRole } = renderWidget();

			const button = getByRole( 'button', { name: /maybe later/i } );
			expect( button ).toBeDisabled();
		} );
	} );

	it( 'renders the CTA when AdSense is not connected and not dismissed', async () => {
		const { container, waitForRegistry } = renderWidget();
		await waitForRegistry();

		expect(
			container.querySelector( '.googlesitekit-setup__wrapper' )
		).not.toBeNull();
	} );

	it( 'renders nothing when AdSense has been previously dismissed', async () => {
		registry
			.dispatch( CORE_USER )
			.receiveGetDismissedItems( [
				ADSENSE_CTA_WIDGET_DISMISSED_ITEM_KEY,
			] );

		const { container, waitForRegistry } = renderWidget();
		await waitForRegistry();

		expect(
			container.querySelector( '.googlesitekit-setup__wrapper' )
		).toBeNull();
	} );

	describe( 'after the dismissal completes', () => {
		beforeEach( () => {
			jest.useFakeTimers();
		} );

		afterEach( () => {
			jest.useRealTimers();
		} );

		it( 'continues to render the CTA while the fade is in progress', () => {
			registry
				.dispatch( CORE_USER )
				.setIsItemDimissing(
					ADSENSE_CTA_WIDGET_DISMISSED_ITEM_KEY,
					true
				);

			const { container } = renderWidget();

			// CTA visible inside the dismiss transition wrapper.
			expect(
				container.querySelector(
					'.googlesitekit-widget-dismiss-transition'
				)
			).not.toBeNull();
			expect(
				container.querySelector( '.googlesitekit-setup__wrapper' )
			).not.toBeNull();
		} );

		it( 'unmounts the widget after the transition timer elapses on success', () => {
			// Start with the dismiss request in flight.
			registry
				.dispatch( CORE_USER )
				.setIsItemDimissing(
					ADSENSE_CTA_WIDGET_DISMISSED_ITEM_KEY,
					true
				);

			const { container } = renderWidget();

			expect(
				container.querySelector( '.googlesitekit-setup__wrapper' )
			).not.toBeNull();

			// Simulate the request resolving successfully.
			act( () => {
				registry
					.dispatch( CORE_USER )
					.receiveGetDismissedItems( [
						ADSENSE_CTA_WIDGET_DISMISSED_ITEM_KEY,
					] );
				registry
					.dispatch( CORE_USER )
					.setIsItemDimissing(
						ADSENSE_CTA_WIDGET_DISMISSED_ITEM_KEY,
						false
					);
			} );

			// CTA still mounted while the fade plays.
			expect(
				container.querySelector( '.googlesitekit-setup__wrapper' )
			).not.toBeNull();

			act( () => {
				jest.advanceTimersByTime( DISMISS_TRANSITION_MS );
			} );

			// After timer: wrapper invokes onDismissComplete, animationComplete
			// flips true, parent renders WidgetNull, CTA gone.
			expect(
				container.querySelector( '.googlesitekit-setup__wrapper' )
			).toBeNull();
		} );
	} );
} );
