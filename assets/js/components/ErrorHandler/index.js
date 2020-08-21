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
import { Component, createRef } from '@wordpress/element';
import { Dashicon } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Notification from '../notifications/notification';
import Link from '../link';
import Button from '../button';

class ErrorHandler extends Component {
	constructor( props ) {
		super( props );

		this.state = {
			error: null,
			info: null,
			copied: false,
		};

		this.errorElement = createRef();
		this.timeoutId = 0;

		this.onErrorClick = this.onErrorClick.bind( this );
		this.setCopiedState = this.changeCopiedState.bind( this, true );
		this.unsetCopiedState = this.changeCopiedState.bind( this, false );
	}

	componentDidCatch( error, info ) {
		global.console.error( 'Caught an error:', error, info );

		this.setState( { error, info } );
	}

	onErrorClick() {
		if ( ! this.errorElement || ! this.errorElement.current ) {
			return;
		}

		const range = document.createRange();
		range.selectNodeContents( this.errorElement.current );

		const selection = global.getSelection();
		selection.removeAllRanges();
		selection.addRange( range );

		document.execCommand( 'copy' );

		selection.removeAllRanges();

		if ( this.timeoutId ) {
			clearTimeout( this.timeoutId );
		}

		this.setCopiedState();
		this.timeoutId = setTimeout( this.unsetCopiedState, 1500 );
	}

	changeCopiedState( copied ) {
		this.setState( { copied } );
	}

	render() {
		const { children } = this.props;
		const { error, info, copied } = this.state;

		// If there is no caught error, render the children components normally.
		if ( ! error ) {
			return children;
		}

		const reportLink = (
			<Link href="https://wordpress.org/support/plugin/google-site-kit/" external>
				{ __( 'Report this problem', 'google-site-kit' ) }
			</Link>
		);

		const icon = (
			<Dashicon
				className="googlesitekit-margin-right-1 googlesitekit-dashicons-fill-white"
				icon={ copied ? 'yes' : 'clipboard' }
			/>
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
				<pre className="googlesitekit-overflow-auto" ref={ this.errorElement }>
					{ error.message }
					{ info.componentStack }
				</pre>
				<Button icon={ icon } onClick={ this.onErrorClick }>
					{ __( 'Copy error to clipboard', 'google-site-kit' ) }
				</Button>
			</Notification>
		);
	}
}

ErrorHandler.propTypes = {
	/** @ignore */
	children: PropTypes.node.isRequired,
};

export default ErrorHandler;
