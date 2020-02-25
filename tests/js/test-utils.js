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
export const testRender = ( ui, options ) => {
	return render( ui, { wrapper: TestProviders, ...options } );
};

// re-export testing library
export * from '@testing-library/react';
