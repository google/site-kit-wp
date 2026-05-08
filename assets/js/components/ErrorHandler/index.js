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
import { Component, Fragment } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import GenericErrorHandlerActions from '@/js/components/GenericErrorHandlerActions';
import ViewContextContext from '@/js/components/Root/ViewContextContext';
import BannerNotification from '@/js/googlesitekit/notifications/components/layout/BannerNotification';
import { trackEvent } from '@/js/util';

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
		const { children, hideFilenamesInStack } = this.props;
		const { error, info } = this.state;

		// If there is no caught error, render the children components normally.
		if ( ! error ) {
			return children;
		}

		let componentStack = info?.componentStack;

		// Hide filenames in stack trace to prevent issues with Visual Regression
		// tests and hashes changing in the stack trace.
		if ( hideFilenamesInStack && componentStack ) {
			componentStack = componentStack
				.replace( /\(.*\)/g, '(filtered)' )
				.replace( /at (.+) ?https?:\/\/.*/g, 'at $1 (filtered)' )
				.replace( /at https?:\/\/.*/g, '' )
				.replace( /\n    \n    /g, '\n    ' );
		}

		return (
			<BannerNotification
				notificationID="googlesitekit-error"
				className="googlesitekit-error-handler"
				type="error"
				title={ __(
					'Site Kit encountered an error',
					'google-site-kit'
				) }
				description={
					<Fragment>
						<GenericErrorHandlerActions
							message={ error.message }
							componentStack={ componentStack }
						/>
						<pre className="googlesitekit-overflow-auto">
							{ error.message }
							{ componentStack }
						</pre>
					</Fragment>
				}
			/>
		);
	}
}

ErrorHandler.contextType = ViewContextContext;

ErrorHandler.propTypes = {
	/** @ignore */
	children: PropTypes.node.isRequired,
};

export default ErrorHandler;
