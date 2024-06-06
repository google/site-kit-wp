/**
 * Error boundary component.
 *
 * Site Kit by Google, Copyright 2024 Google LLC
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
import { trackEvent } from '../util';
import ViewContextContext from './Root/ViewContextContext';
import Widget from '../googlesitekit/widgets/components/Widget';

/**
 * ErrorBoundary component.
 */
class ErrorBoundary extends Component {
	constructor( props ) {
		super( props );
		this.state = {
			error: null,
			info: null,
		};
	}

	/**
	 * Logs the error information using trackEvent.
	 *
	 * @since n.e.x.t
	 *
	 * @param {Object|string} error Error object.
	 * @param {Object}        info  Error info object.
	 */
	componentDidCatch( error, info ) {
		this.setState( {
			error,
			info,
		} );

		if ( !! error ) {
			// Track the error event.
			trackEvent(
				'react_error',
				`handle_${ this.context || 'unknown' }_error`,
				// label has a max-length of 500 bytes.
				`${ error?.message }\n${ info?.componentStack }`.slice( 0, 500 )
			);
		}
	}

	/**
	 * Renders the component in errored state.
	 *
	 * @since n.e.x.t
	 *
	 * @return {JSX} Error description component.
	 */
	render() {
		const slug = this.props.slug;

		if ( this.state.error ) {
			return (
				<Widget
					nopadding
					widgetSlug={ slug }
					className="googlesitekit-error-handler"
				>
					<div className="googlesitekit-error-description">
						<h3>{ __( 'Error!', 'google-site-kit' ) }</h3>
						<p className="googlesitekit-error-text">
							{ this.state.error?.message }
						</p>
						<p className="googlesitekit-error-component-stack">
							{ this.state.info?.componentStack }
						</p>
					</div>
				</Widget>
			);
		}

		return this.props.children;
	}
}

ErrorBoundary.contextType = ViewContextContext;

ErrorBoundary.propTypes = {
	/** @ignore */
	children: PropTypes.node.isRequired,
};

export default ErrorBoundary;
