import { registerPlugin } from '@wordpress-core/plugins'; // Uses the mock due to moduleNameMapper
import { registerReaderRevenueManagerPlugin } from './plugin-registration';
import { select, resolveSelect } from 'googlesitekit-data';
import SettingPanel from './components/SettingPanel';
import { CORE_MODULES } from '../../assets/js/googlesitekit/modules/datastore/constants';
import { MODULES_READER_REVENUE_MANAGER } from '../../assets/js/modules/reader-revenue-manager/datastore/constants';

jest.mock( 'googlesitekit-data', () => ( {
	select: jest.fn(),
	resolveSelect: jest.fn(),
} ) );

describe( 'registerReaderRevenueManagerPlugin', () => {
	beforeEach( () => {
		jest.clearAllMocks(); // Reset mock calls before each test
	} );

	it( 'should register the plugin if the module is connected', async () => {
		// Mock `resolveSelect` behavior
		resolveSelect.mockImplementation( ( store ) => {
			if ( store === CORE_MODULES ) {
				return { getModules: jest.fn().mockResolvedValue( {} ) };
			}
			if ( store === MODULES_READER_REVENUE_MANAGER ) {
				return { getSettings: jest.fn().mockResolvedValue( {} ) };
			}
		} );

		// Mock `select` behavior
		select.mockImplementation( ( store ) => {
			if ( store === CORE_MODULES ) {
				return { isModuleConnected: jest.fn().mockReturnValue( true ) };
			}
		} );

		await registerReaderRevenueManagerPlugin();

		// Ensure `registerPlugin` is called with expected arguments
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

		// Ensure `registerPlugin` is NOT called
		expect( registerPlugin ).not.toHaveBeenCalled();
	} );
} );
