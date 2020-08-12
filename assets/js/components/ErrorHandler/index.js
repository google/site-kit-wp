/**
 * ErrorHandler component.
 *
 * Google Site Kit, Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

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

		const errorInfo = (
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
				{ errorInfo }
			</Notification>
		);
	}
}

ErrorHandler.propTypes = {
	/** @ignore */
	children: PropTypes.node.isRequired,
};

export default ErrorHandler;
