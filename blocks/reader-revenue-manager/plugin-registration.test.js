jest.mock( '@wordpress-core/plugins', () => ( {
	registerPlugin: jest.fn(),
} ) );

import { registerPlugin } from '@wordpress-core/plugins';
import { select, resolveSelect } from 'googlesitekit-data';
import { CORE_MODULES } from '../../assets/js/googlesitekit/modules/datastore/constants';
import { MODULES_READER_REVENUE_MANAGER } from '../../assets/js/modules/reader-revenue-manager/datastore/constants';
import { registerReaderRevenueManagerPlugin } from './plugin-registration';
import SettingPanel from './components/SettingPanel';

describe( 'registerReaderRevenueManagerPlugin', () => {
	beforeEach( () => {
		jest.clearAllMocks();
	} );

	it( 'should register the plugin if the module is connected', async () => {
		resolveSelect.mockImplementation( ( store ) => {
			if ( store === CORE_MODULES ) {
				return { getModules: jest.fn().mockResolvedValue( {} ) };
			}
			if ( store === MODULES_READER_REVENUE_MANAGER ) {
				return { getSettings: jest.fn().mockResolvedValue( {} ) };
			}
		} );

		select.mockImplementation( ( store ) => {
			if ( store === CORE_MODULES ) {
				return { isModuleConnected: jest.fn().mockReturnValue( true ) };
			}
		} );

		await registerReaderRevenueManagerPlugin(); // Ensure the promise resolves

		expect( registerPlugin ).toHaveBeenCalledWith(
			'googlesitekit-rrm-plugin',
			{
				render: SettingPanel,
			}
		);
	} );

	it( 'should not register the plugin if the module is not connected', async () => {
		resolveSelect.mockImplementation( ( store ) => {
			if ( store === CORE_MODULES ) {
				return { getModules: jest.fn().mockResolvedValue( {} ) };
			}
			if ( store === MODULES_READER_REVENUE_MANAGER ) {
				return { getSettings: jest.fn().mockResolvedValue( {} ) };
			}
		} );

		select.mockImplementation( ( store ) => {
			if ( store === CORE_MODULES ) {
				return {
					isModuleConnected: jest.fn().mockReturnValue( false ),
				};
			}
		} );

		await registerReaderRevenueManagerPlugin();

		expect( registerPlugin ).not.toHaveBeenCalled();
	} );
} );
