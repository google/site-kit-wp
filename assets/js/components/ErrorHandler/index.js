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
import Notification from '../notifications/notification';

class ErrorHandler extends Component {
	constructor( props ) {
		super( props );

		this.state = {
			error: null,
			info: null,
		};

		this.errorClickHandler = this.onErrorClick.bind( this );
	}

	componentDidCatch( error, info ) {
		global.console.error( 'Caught an error:', error, info );

		this.setState( { error, info } );
	}

	onErrorClick( e ) {
		const range = document.createRange();
		range.selectNodeContents( e.target );

		const selection = global.getSelection();
		selection.removeAllRanges();
		selection.addRange( range );
	}

	render() {
		const { children } = this.props;
		const { error, info } = this.state;

		// If there is no caught error, render the children components normally.
		if ( ! error ) {
			return children;
		}

		const reportLink = (
			<a href="https://wordpress.org/support/plugin/google-site-kit/" target="_blank" rel="noopener noreferrer">
				{ __( 'Report this problem', 'google-site-kit' ) }
			</a>
		);

		const code = (
			// eslint-disable-next-line
			<pre onClick={ this.errorClickHandler } style={ { overflow: 'auto' } }>
				{ error.message + info.componentStack }
			</pre>
		);

		return (
			<Notification
				id="googlesitekit-error"
				title={ __( 'Site Kit encountered an error', 'google-site-kit' ) }
				description={ reportLink }
				isDismissable={ false }
				format="small"
				type="win-error"
			>
				{ code }
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
