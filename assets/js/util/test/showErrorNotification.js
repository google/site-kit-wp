/**
 * External dependencies
 */
import { render } from '@testing-library/react';

/**
 * WordPress dependencies
 */
import { applyFilters } from '@wordpress/hooks';

/**
 * Internal dependencies
 */
import { showErrorNotification } from '../';

describe( 'showErrorNotification', () => {
	it( 'returns null if nothing is passed', () => {
		showErrorNotification( () => null );

		const { container } = render( applyFilters( 'googlesitekit.ErrorNotification', [] )() );

		expect( container ).toMatchSnapshot();
	} );

	it( 'filters the ErrorNotification component', () => {
		const Error = () => 'Error Message';
		showErrorNotification( Error, {
			id: 'dummy-error',
		} );

		const { container } = render( applyFilters( 'googlesitekit.ErrorNotification', [] )() );

		expect( container ).toMatchSnapshot();
	} );
} );
