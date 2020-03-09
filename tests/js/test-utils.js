/**
 * External dependencies
 */
import { render } from '@testing-library/react';
import PropTypes from 'prop-types';

/**
 * WordPress dependencies
 */
import { Fragment } from '@wordpress/element';

const TestProviders = ( { children } ) => {
	return (
		<Fragment>
			{ children }
		</Fragment>
	);
};

TestProviders.defaultProps = {
	children: undefined,
};

TestProviders.propTypes = {
	children: PropTypes.node,
};

// custom render with the test provider component
const customRender = ( ui, options ) => {
	return render( ui, { wrapper: TestProviders, ...options } );
};

// Export our own test utils from this file.
export * from 'tests/js/utils';

// Export @testing-library/react as normal.
export * from '@testing-library/react';

// Override @testing-library/react's render method with our own.
export { customRender as render };
