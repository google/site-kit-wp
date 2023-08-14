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
import PropTypes from 'prop-types';

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import GenericErrorHandlerActions from '../GenericErrorHandlerActions';
import ViewContextContext from '../Root/ViewContextContext';
import Notification from '../notifications/BannerNotification';
import { trackEvent } from '../../util';

class ErrorHandler extends Component {
	constructor( props ) {
		super( props );

		this.state = {
			error: null,
			info: null,
			copied: false,
		};
	}

	componentDidCatch( error, info ) {
		global.console.error( 'Caught an error:', error, info );

		this.setState( { error, info } );

		trackEvent(
			'react_error',
			`handle_${ this.context || 'unknown' }_error`,
			// label has a max-length of 500 bytes.
			`${ error?.message }\n${ info?.componentStack }`.slice( 0, 500 )
		);
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
				className="googlesitekit-error-handler"
				title={ __(
					'Site Kit encountered an error',
					'google-site-kit'
				) }
				description={
					<GenericErrorHandlerActions
						message={ error.message }
						componentStack={ info.componentStack }
					/>
				}
				isDismissible={ false }
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

ErrorHandler.contextType = ViewContextContext;

ErrorHandler.propTypes = {
	/** @ignore */
	children: PropTypes.node.isRequired,
};

export default ErrorHandler;
