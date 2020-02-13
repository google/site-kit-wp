/**
 * External dependencies
 */
import PropTypes from 'prop-types';

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Notification from 'GoogleComponents/notifications/notification';

class ErrorHandler extends Component {
	constructor( props ) {
		super( props );

		this.state = {
			error: null,
			info: null,
		};
	}

	componentDidCatch( error, info ) {
		global.console.error( 'Caught an error:', error, info );

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
			<Notification
				id="googlesitekit-error"
				title={ __( 'Site Kit encountered an error', 'google-site-kit' ) }
				description={ <code>{ error.message }</code> }
				isDismissable={ false }
				format="small"
				type="win-error"
			>
				<pre>{ info.componentStack }</pre>
			</Notification>
		);
	}
}

ErrorHandler.defaultProps = {};

ErrorHandler.propTypes = {
	/** @ignore */
	children: PropTypes.node.isRequired,
};

export default ErrorHandler;
