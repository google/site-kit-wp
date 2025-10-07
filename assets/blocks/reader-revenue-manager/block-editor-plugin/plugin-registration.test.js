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

vi.mock(
	'@wordpress-core/plugins',
	() => ( {
		registerPlugin: vi.fn(),
	} ),
	{
		virtual: true,
	}
);

vi.mock( '@wordpress-core/edit-post', () => ( {} ), {
	virtual: true,
} );
vi.mock( '@wordpress-core/editor', () => ( {} ), {
	virtual: true,
} );
vi.mock( '@wordpress-core/components', () => ( {} ), {
	virtual: true,
} );
vi.mock( '@wordpress-core/element', () => ( {} ), { virtual: true } );
vi.mock( './tracking', () => ( {
	initializeTracking: vi.fn(),
} ) );

import Data from 'googlesitekit-data';
import SettingPanel from './SettingPanel';
import { MODULES_READER_REVENUE_MANAGER } from '@/js/modules/reader-revenue-manager/datastore/constants';
import { MODULE_SLUG_READER_REVENUE_MANAGER } from '@/js/modules/reader-revenue-manager/constants';
import { registerStore as registerCoreModulesStore } from '@/js/googlesitekit/modules';
import { registerStore as registerCoreUserStore } from '@/js/googlesitekit/datastore/user';
import { registerStore as registerReaderRevenueManagerStore } from '@/js/modules/reader-revenue-manager/datastore';
import { provideModules, provideUserInfo } from '../../../../tests/js/utils';
import { registerPlugin } from '@wordpress-core/plugins';
import { registerReaderRevenueManagerPlugin } from './plugin-registration';

const { dispatch } = Data;

describe( 'registerReaderRevenueManagerPlugin', () => {
	const rrmModuleDefaults = {
		slug: MODULE_SLUG_READER_REVENUE_MANAGER,
		active: true,
		connected: true,
		storeName: MODULES_READER_REVENUE_MANAGER,
		owner: 1,
	};

	beforeEach( () => {
		registerCoreModulesStore( Data );
		registerCoreUserStore( Data );
		registerReaderRevenueManagerStore( Data );

		dispatch( MODULES_READER_REVENUE_MANAGER ).receiveGetSettings( {
			publicationID: 'ABCDEFGH',
			ownerID: 1,
		} );
	} );

	afterEach( () => {
		vi.clearAllMocks();
	} );

	it( 'should register the plugin if the user has ownership', async () => {
		provideModules( Data, [ rrmModuleDefaults ] );

		provideUserInfo( Data );

		await registerReaderRevenueManagerPlugin();

		expect( registerPlugin ).toHaveBeenCalledWith(
			'googlesitekit-rrm-plugin',
			{
				render: SettingPanel,
			}
		);
	} );

	it( 'should register the plugin if the user has access', async () => {
		provideModules( Data, [ rrmModuleDefaults ] );

		provideUserInfo( Data );

		dispatch( MODULES_READER_REVENUE_MANAGER ).setSettings( {
			ownerID: 2,
		} );

		fetchMock.postOnce(
			new RegExp( '/google-site-kit/v1/core/modules/data/check-access' ),
			{ body: { access: true } }
		);

		await registerReaderRevenueManagerPlugin();

		expect( registerPlugin ).toHaveBeenCalledWith(
			'googlesitekit-rrm-plugin',
			{
				render: SettingPanel,
			}
		);
	} );

	it( 'should not register the plugin if the user does not have ownership or access', async () => {
		provideModules( Data, [ rrmModuleDefaults ] );

		provideUserInfo( Data );

		dispatch( MODULES_READER_REVENUE_MANAGER ).setSettings( {
			ownerID: 2,
		} );

		fetchMock.postOnce(
			new RegExp( '/google-site-kit/v1/core/modules/data/check-access' ),
			{ body: { access: false } }
		);

		await registerReaderRevenueManagerPlugin();

		expect( registerPlugin ).not.toHaveBeenCalled();
	} );
} );
