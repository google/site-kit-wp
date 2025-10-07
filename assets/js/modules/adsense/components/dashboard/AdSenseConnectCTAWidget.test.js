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
const mockShowTooltip = vi.fn();
vi.mock( '../../../../components/AdminMenuTooltip', () => ( {
	__esModule: true,
	default: vi.fn(),
	useShowTooltip: vi.fn( () => mockShowTooltip ),
} ) );

import AdSenseConnectCTAWidget from './AdSenseConnectCTAWidget';
import {
	act,
	fireEvent,
	render,
	createTestRegistry,
	provideSiteInfo,
	provideUserAuthentication,
} from '../../../../../../tests/js/test-utils';
import {
	ADSENSE_CTA_WIDGET_DISMISSED_ITEM_KEY,
	MODULE_SLUG_ADSENSE,
} from '@/js/modules/adsense/constants';
import { CORE_MODULES } from '@/js/googlesitekit/modules/datastore/constants';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import { MODULES_ADSENSE } from '@/js/modules/adsense/datastore/constants';
import { withActive } from '@/js/googlesitekit/modules/datastore/__fixtures__';
import { withWidgetComponentProps } from '@/js/googlesitekit/widgets/util';

describe( 'AdSenseConnectCTA', () => {
	let registry;

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

	describe( 'after click', () => {
		let container;
		beforeEach( async () => {
			fetchMock.postOnce(
				RegExp( '/google-site-kit/v1/core/user/data/dismiss-item' ),
				{
					body: JSON.stringify( [
						ADSENSE_CTA_WIDGET_DISMISSED_ITEM_KEY,
					] ),
					status: 200,
				}
			);

			container = render(
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

			const { getByRole } = container;

			// eslint-disable-next-line require-await
			await act( async () => {
				fireEvent.click(
					getByRole( 'button', { name: /maybe later/i } )
				);
			} );
		} );

		it( 'should open the tooltip', () => {
			expect( mockShowTooltip ).toHaveBeenCalled();
		} );
	} );

	it( 'should render WidgetNull when the widget is being dismissed', () => {
		registry
			.dispatch( CORE_USER )
			.setIsItemDimissing( ADSENSE_CTA_WIDGET_DISMISSED_ITEM_KEY, true );

		const { container } = render( <WidgetWithComponentProps />, {
			registry,
		} );

		expect( container ).toBeEmptyDOMElement();
	} );
} );
