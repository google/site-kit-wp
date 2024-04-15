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
import SettingsNotice from './SettingsNotice';
import { CORE_USER } from '../../googlesitekit/datastore/user/constants';

const TEST_ITEM_DISMISSED_KEY = 'test-item-dismissed-key';
const fetchGetDismissedItemsRegExp = new RegExp(
	'^/google-site-kit/v1/core/user/data/dismissed-items'
);
const fetchDismissItemRegExp = new RegExp(
	'^/google-site-kit/v1/core/user/data/dismiss-item'
);

const mockDismissCallback = jest.fn();

const renderSettingsNoticeWithMockUI = ( registry, overrideProps = {} ) =>
	render(
		<SettingsNotice
			dismiss={ TEST_ITEM_DISMISSED_KEY }
			dismissCallback={ mockDismissCallback }
			dismissLabel="Test label"
			notice="Test notice content..."
			{ ...overrideProps }
		/>,
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
