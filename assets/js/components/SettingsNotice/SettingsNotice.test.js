/**
 * SettingsNotice tests.
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
 * Internal dependencies
 */
import {
	render,
	fireEvent,
	createTestRegistry,
	muteFetch,
} from '../../../../tests/js/test-utils';
import { Provider as ViewContextProvider } from '../Root/ViewContextContext';
import SettingsNotice from './SettingsNotice';
import { ADS_CONVERSION_ID_NOTICE_DISMISSED_ITEM_KEY } from '../../modules/analytics-4/constants';
import { CORE_USER } from '../../googlesitekit/datastore/user/constants';

const TEST_VIEW_CONTEXT = 'testViewContext';
const fetchGetDismissedItemsRegExp = new RegExp(
	'^/google-site-kit/v1/core/user/data/dismissed-items'
);
const fetchDismissItemRegExp = new RegExp(
	'^/google-site-kit/v1/core/user/data/dismiss-item'
);

function MockUIWrapper( { children } ) {
	return (
		<ViewContextProvider value={ TEST_VIEW_CONTEXT }>
			{ children }
		</ViewContextProvider>
	);
}

const mockDismissCallback = jest.fn();

const renderSettingsNoticeWithMockUI = ( registry, overrideProps = {} ) =>
	render(
		<MockUIWrapper>
			<SettingsNotice
				dismiss={ ADS_CONVERSION_ID_NOTICE_DISMISSED_ITEM_KEY }
				dismissCallback={ mockDismissCallback }
				dismissLabel="Test label"
				notice="Test notice content..."
				{ ...overrideProps }
			/>
		</MockUIWrapper>,
		{ registry }
	);

describe( 'SettingsNotice', () => {
	let registry;

	beforeEach( () => {
		registry = createTestRegistry();
		registry.dispatch( CORE_USER ).receiveGetDismissedItems( [] );
	} );

	it( 'fires a dismiss callback upon dismissal', () => {
		muteFetch( fetchGetDismissedItemsRegExp );
		muteFetch( fetchDismissItemRegExp );

		const { getByRole } = renderSettingsNoticeWithMockUI( registry );

		fireEvent.click( getByRole( 'button' ) );

		expect( mockDismissCallback ).toHaveBeenCalledTimes( 1 );
	} );
} );
