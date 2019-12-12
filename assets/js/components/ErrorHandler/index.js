/**
 * External dependencies
 */
import PropTypes from 'prop-types';

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';

class ErrorHandler extends Component {
	constructor( props ) {
		super( props );

		this.state = {
			error: null,
			info: null,
		};
	}

	componentDidCatch( error, info ) {
		window.console.error( 'Caught application error:', error, info );

		this.setState( { error, info } );
	}

	render() {
		const { children } = this.props;
		const { error, info } = this.state;

		// If there is no caught error, render the children components normally.
		if ( ! error ) {
			return children;
		}

		return (
			<div>
				ERROR: { error }
				INFO: { info }
			</div>
		);
	}
}

ErrorHandler.defaultProps = {};

ErrorHandler.propTypes = {
	/** @ignore */
	children: PropTypes.node.isRequired,
};

export default ErrorHandler;
