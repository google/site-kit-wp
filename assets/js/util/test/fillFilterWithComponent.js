/**
 * External dependencies
 */
import { render } from '@testing-library/react';

/**
 * WordPress dependencies
 */
import { applyFilters, addFilter } from '@wordpress/hooks';

/**
 * Internal dependencies
 */
import { fillFilterWithComponent } from '../';

describe( 'fillFilterWithComponent', () => {
	it( 'fills filtered component', () => {
		const filterTester = () => '::added::';

		addFilter( 'googlesitekit.Test', 'googlesitekit.AdSenseModuleSettingsDetails', fillFilterWithComponent( filterTester, {} ) );

		const { container } = render( applyFilters( 'googlesitekit.Test', 'test' )() );
		expect( container.firstChild ).toMatchSnapshot();
	} );
} );
