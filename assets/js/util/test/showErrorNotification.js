/**
 * External dependencies
 */
import { applyFilters } from '@wordpress/hooks';
import { render } from 'enzyme';

/**
 * Internal dependencies
 */
import { showErrorNotification } from '../';

// Disable reason: Needs investigation.
// eslint-disable-next-line jest/no-disabled-tests
describe.skip( 'showErrorNotification', () => {
	it( 'returns null if nothing is passed', () => {
		showErrorNotification( null );

		const component = applyFilters( 'googlesitekit.ErrorNotification', [] );
		const notification = render( component );

		expect( notification ).toMatchSnapshot();
	} );

	it( 'filters the ErrorNotification component', () => {
		const Error = () => 'Error Message';
		showErrorNotification( Error, {
			id: 'dummy-error',
		} );

		const component = applyFilters( 'googlesitekit.ErrorNotification', [] );
		const notification = render( component );

		expect( notification ).toMatchSnapshot();
	} );
} );
