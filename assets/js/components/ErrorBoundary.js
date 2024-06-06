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
import { trackEvent } from '../util';
import ViewContextContext from './Root/ViewContextContext';

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
	 * Updates the state when error occurs so that UI can be updated.
	 *
	 * @since n.e.x.t
	 *
	 * @param {Object|string} error Error instance.
	 * @return {Object} Updated state object.
	 */
	static getDerivedStateFromError( error ) {
		// Update state so the next render will show the fallback UI.
		return { hasError: true, errorMessage: error?.message };
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
		// Track the error event.
		trackEvent(
			'react_error',
			`handle_${ this.context || 'unknown' }_error`,
			// label has a max-length of 500 bytes.
			`${ error?.message }\n${ info?.componentStack }`.slice( 0, 500 )
		);
	}

	/**
	 * Renders the component in errored state.
	 *
	 * @since n.e.x.t
	 *
	 * @return {JSX} Error description component.
	 */
	render() {
		if ( this.state.error ) {
			// You can render any custom fallback UI
			return <h3>Something went wrong.</h3>;
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
