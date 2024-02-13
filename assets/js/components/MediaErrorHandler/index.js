/**
 * MediaErrorHandler component.
 *
 * Site Kit by Google, Copyright 2022 Google LLC
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
import ErrorText from '../ErrorText';

class MediaErrorHandler extends Component {
	constructor( props ) {
		super( props );

		this.state = {
			error: null,
		};
	}

	componentDidCatch( error, info ) {
		global.console.error( 'Caught an error:', error, info );

		this.setState( { error } );
	}

	render() {
		const { children, errorMessage } = this.props;
		const { error } = this.state;

		// If there is no caught error, render the children components normally.
		if ( ! error ) {
			return children;
		}

		return <ErrorText message={ errorMessage } />;
	}
}

MediaErrorHandler.defaultProps = {
	errorMessage: __( 'Failed to load media', 'google-site-kit' ),
};

MediaErrorHandler.propTypes = {
	children: PropTypes.node.isRequired,
	errorMessage: PropTypes.string.isRequired,
};

export default MediaErrorHandler;
