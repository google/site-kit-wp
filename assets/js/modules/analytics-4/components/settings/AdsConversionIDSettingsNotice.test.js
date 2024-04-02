/**
 * AdsConversionIDSettingsNotice tests.
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

import { ADS_CONVERSION_ID_NOTICE_DISMISSED_ITEM_KEY } from '../../constants';
import { CORE_USER } from '../../../../googlesitekit/datastore/user/constants';
import { DAY_IN_SECONDS } from '../../../../util';
import { MODULES_ANALYTICS_4 } from '../../datastore/constants';
import AdsConversionIDSettingsNotice from './AdsConversionIDSettingsNotice';
import { render } from '../../../../../../tests/js/test-utils';
import { createTestRegistry } from '../../../../../../tests/js/utils';

describe( 'AdsConversionIDSettingsNotice', () => {
	let registry;

	beforeEach( () => {
		registry = createTestRegistry();

		registry.dispatch( CORE_USER ).receiveGetDismissedItems( [] );
	} );

	it( 'should not render if the migration has not been performed', () => {
		registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetSettings( {} );

		const { container } = render( <AdsConversionIDSettingsNotice />, {
			registry,
		} );

		expect( container ).toBeEmptyDOMElement();
	} );

	it( 'should not render if it has been over 28 days since the migration', () => {
		registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetSettings( {
			adsConversionIDMigratedAtMs:
				Date.now() - 29 * DAY_IN_SECONDS * 1000, // 29 days ago.
		} );

		const { container } = render( <AdsConversionIDSettingsNotice />, {
			registry,
		} );

		expect( container ).toBeEmptyDOMElement();
	} );

	it( 'should not render if the notice has been dismissed', () => {
		registry
			.dispatch( CORE_USER )
			.receiveGetDismissedItems( [
				ADS_CONVERSION_ID_NOTICE_DISMISSED_ITEM_KEY,
			] );

		registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetSettings( {
			adsConversionIDMigratedAtMs: Date.now() - 7 * DAY_IN_SECONDS * 1000, // 7 days ago.
		} );

		const { container } = render( <AdsConversionIDSettingsNotice />, {
			registry,
		} );

		expect( container ).toBeEmptyDOMElement();
	} );

	it( 'should render the notice', () => {
		registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetSettings( {
			adsConversionIDMigratedAtMs: Date.now() - 7 * DAY_IN_SECONDS * 1000, // 7 days ago.
		} );

		const { container } = render( <AdsConversionIDSettingsNotice />, {
			registry,
		} );

		expect( container ).toHaveTextContent(
			'Ads Conversion Tracking ID has been moved to Ads settings'
		);

		expect( container ).toMatchSnapshot();
	} );
} );
