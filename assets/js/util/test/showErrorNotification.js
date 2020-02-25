/**
 * WordPress dependencies
 */
import { applyFilters } from '@wordpress/hooks';

/**
 * Internal dependencies
 */
import { testRender } from '../../../../tests/js/test-utils';
import { showErrorNotification } from '../';

describe( 'showErrorNotification', () => {
	it( 'returns null if nothing is passed', () => {
		showErrorNotification( () => null );

		const { container } = testRender( applyFilters( 'googlesitekit.ErrorNotification', [] )() );

		expect( container ).toMatchSnapshot();
	} );

	it( 'filters the ErrorNotification component', () => {
		const Error = () => 'Error Message';
		showErrorNotification( Error, {
			id: 'dummy-error',
		} );

		const { container } = testRender( applyFilters( 'googlesitekit.ErrorNotification', [] )() );

		expect( container ).toMatchSnapshot();
	} );
} );
