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
 * Internal dependencies
 */
import AdSenseConnectCTAWidget from './AdSenseConnectCTAWidget';
import {
	act,
	fireEvent,
	render,
	createTestRegistry,
	provideSiteInfo,
	provideUserAuthentication,
} from '../../../../../../tests/js/test-utils';
import { ADSENSE_CTA_WIDGET_DISMISSED_ITEM_KEY } from '../../constants';
import { CORE_MODULES } from '../../../../googlesitekit/modules/datastore/constants';
import { CORE_USER } from '../../../../googlesitekit/datastore/user/constants';
import { MODULES_ADSENSE } from '../../datastore/constants';
import { withActive } from '../../../../googlesitekit/modules/datastore/__fixtures__';

describe( 'AdSenseConnectCTA', () => {
	let registry;
	beforeEach( () => {
		registry = createTestRegistry();
		registry.dispatch( MODULES_ADSENSE ).setSettings( {} );
		provideSiteInfo( registry );
		provideUserAuthentication( registry );
		registry
			.dispatch( CORE_MODULES )
			.receiveGetModules( withActive( 'adsense' ) );
		registry.dispatch( CORE_USER ).receiveGetDismissedItems( [] );
	} );

	describe( 'after click', () => {
		let container;
		beforeEach( async () => {
			fetchMock.postOnce(
				RegExp( '^/google-site-kit/v1/core/user/data/dismiss-item' ),
				{
					body: JSON.stringify( [
						ADSENSE_CTA_WIDGET_DISMISSED_ITEM_KEY,
					] ),
					status: 200,
				}
			);

			const Widget = ( { children } ) => <div>{ children }</div>;
			const WidgetNull = () => <div>NULL</div>;

			container = render(
				<div>
					<div id="adminmenu">
						<a href="http://test.test/wp-admin/admin.php?page=googlesitekit-settings">
							Settings
						</a>
					</div>
					<AdSenseConnectCTAWidget
						Widget={ Widget }
						WidgetNull={ WidgetNull }
					/>
				</div>,
				{ registry }
			).container;

			// eslint-disable-next-line require-await
			await act( async () => {
				fireEvent.click(
					container.querySelector( 'button.googlesitekit-cta-link' )
				);
			} );
		} );

		it( 'should open the tooltip', () => {
			expect(
				document.querySelector( '.googlesitekit-tour-tooltip' )
			).toBeInTheDocument();
		} );

		it( 'should close the tooltip on clicking the close button', async () => {
			// eslint-disable-next-line require-await
			await act( async () => {
				fireEvent.click(
					document.querySelector( '.googlesitekit-tooltip-close' )
				);
			} );
			expect(
				document.querySelector( '.googlesitekit-tour-tooltip' )
			).not.toBeInTheDocument();
		} );

		it( 'should close the modal on clicking the dismiss button', async () => {
			// eslint-disable-next-line require-await
			await act( async () => {
				fireEvent.click(
					document.querySelector(
						'.googlesitekit-tooltip-buttons > button'
					)
				);
			} );
			expect(
				document.querySelector( '.googlesitekit-tour-tooltip' )
			).not.toBeInTheDocument();
		} );
	} );
} );
