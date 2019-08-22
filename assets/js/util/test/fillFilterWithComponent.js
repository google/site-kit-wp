/**
 * External dependencies
 */
import { applyFilters, addFilter } from '@wordpress/hooks';
import { render } from 'enzyme';

/**
 * Internal dependencies
 */
import { fillFilterWithComponent } from '../';

// Disable reason: Needs investigation.
// eslint-disable-next-line jest/no-disabled-tests
describe.skip( 'fillFilterWithComponent', () => {
	it( 'fills filtered component', () => {
		const filterTester = () => '::added::';

		addFilter( 'googlesitekit.Test', 'googlesitekit.AdSenseModuleSettingsDetails', fillFilterWithComponent( filterTester, {} ) );

		const component = render( applyFilters( 'googlesitekit.Test', 'test' )() );
		expect( component ).toStrictEqual( '::added::' );
	} );
} );
