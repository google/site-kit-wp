/**
 * WordPress dependencies
 */
import { applyFilters, addFilter } from '@wordpress/hooks';

/**
 * Internal dependencies
 */
import { testRender } from '../../../../tests/js/test-utils';
import { fillFilterWithComponent } from '../';

describe( 'fillFilterWithComponent', () => {
	it( 'fills filtered component', () => {
		const filterTester = () => '::added::';

		addFilter( 'googlesitekit.Test', 'googlesitekit.AdSenseModuleSettingsDetails', fillFilterWithComponent( filterTester, {} ) );

		const { container } = testRender( applyFilters( 'googlesitekit.Test', 'test' )() );
		expect( container.firstChild ).toMatchSnapshot();
	} );
} );
