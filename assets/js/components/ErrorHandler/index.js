/**
 * ErrorHandler component.
 *
 * Site Kit by Google, Copyright 2021 Google LLC
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
import copyToClipboard from 'clipboard-copy';
import PropTypes from 'prop-types';

/**
 * WordPress dependencies
 */
import { Component, Fragment } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Icon, check, stack } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import Notification from '../legacy-notifications/notification';
import Link from '../Link';
import Button from '../Button';
import { trackEvent } from '../../util';

class ErrorHandler extends Component {
	constructor( props ) {
		super( props );

		this.state = {
			error: null,
			info: null,
			copied: false,
		};

		this.onErrorClick = this.onErrorClick.bind( this );
	}

	componentDidCatch( error, info ) {
		const { viewContext = 'unknown' } = this.props;
		global.console.error( 'Caught an error:', error, info );

		this.setState( { error, info } );

		trackEvent(
			'react_error',
			`handle_${ viewContext }_error`,
			// label has a max-length of 500 bytes.
			`${ error?.message }\n${ info?.componentStack }`.slice( 0, 500 )
		);
	}

	onErrorClick() {
		const { error, info } = this.state;

		// Copy message with wrapping backticks for code block formatting on wp.org.
		copyToClipboard( `\`${ error?.message }\n${ info?.componentStack }\`` );

		this.setState( { copied: true } );
	}

	render() {
		const { children } = this.props;
		const { error, info, copied } = this.state;

		// If there is no caught error, render the children components normally.
		if ( ! error ) {
			return children;
		}

		const icon = <Icon
			className="mdc-button__icon"
			icon={ copied ? check : stack }
		/>;

		return (
			<Notification
				id="googlesitekit-error"
				title={ __( 'Site Kit encountered an error', 'google-site-kit' ) }
				description={ (
					<Fragment>
						<Button trailingIcon={ icon } onClick={ this.onErrorClick }>
							{ __( 'Copy error to clipboard', 'google-site-kit' ) }
						</Button>
						<Link href="https://wordpress.org/support/plugin/google-site-kit/" external>
							{ __( 'Report this problem', 'google-site-kit' ) }
						</Link>
					</Fragment>
				) }
				isDismissable={ false }
				format="small"
				type="win-error"
			>
				<pre className="googlesitekit-overflow-auto">
					{ error.message }
					{ info.componentStack }
				</pre>
			</Notification>
		);
	}
}

ErrorHandler.propTypes = {
	/** @ignore */
	children: PropTypes.node.isRequired,
};

export default ErrorHandler;
