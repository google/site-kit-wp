/**
 * Plugin registration test.
 *
 * Site Kit by Google, Copyright 2025 Google LLC
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

jest.mock(
	'@wordpress-core/plugins',
	() => ( {
		registerPlugin: jest.fn(),
	} ),
	{
		virtual: true,
	}
);

jest.mock( '@wordpress-core/edit-post', () => ( {} ), {
	virtual: true,
} );
jest.mock( '@wordpress-core/components', () => ( {} ), {
	virtual: true,
} );
jest.mock( '@wordpress-core/element', () => ( {} ), { virtual: true } );

import Data from 'googlesitekit-data';
import SettingPanel from './SettingPanel';
import { MODULES_READER_REVENUE_MANAGER } from '../../../assets/js/modules/reader-revenue-manager/datastore/constants';
import { provideModules } from '../../../tests/js/utils';
import { registerPlugin } from '@wordpress-core/plugins';
import { registerStore } from '../../../assets/js/modules/reader-revenue-manager/datastore';
import { registerReaderRevenueManagerPlugin } from './plugin-registration';

registerStore( Data );

const { dispatch } = Data;

describe( 'registerReaderRevenueManagerPlugin', () => {
	beforeEach( () => {
		jest.clearAllMocks();

		dispatch( MODULES_READER_REVENUE_MANAGER ).receiveGetSettings( {
			publicationID: 'ABCDEFGH',
		} );
	} );

	it( 'should register the plugin if the module is connected', async () => {
		provideModules( Data, [
			{
				slug: 'reader-revenue-manager',
				active: true,
				connected: true,
			},
		] );

		await registerReaderRevenueManagerPlugin();

		expect( registerPlugin ).toHaveBeenCalledWith(
			'googlesitekit-rrm-plugin',
			{
				render: SettingPanel,
			}
		);
	} );

	it( 'should not register the plugin if the module is not connected', async () => {
		provideModules( Data, [
			{
				slug: 'reader-revenue-manager',
				active: true,
				connected: false,
			},
		] );

		await registerReaderRevenueManagerPlugin();

		expect( registerPlugin ).not.toHaveBeenCalled();
	} );
} );
