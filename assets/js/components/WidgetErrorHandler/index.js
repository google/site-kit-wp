/**
 * WidgetErrorHandler component.
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
import copyToClipboard from 'clipboard-copy';
import PropTypes from 'prop-types';

/**
 * WordPress dependencies
 */
import { Component, Fragment } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import CTA from '../notifications/CTA';
import GenericErrorHandlerActions from '../GenericErrorHandlerActions';
import ViewContextContext from '../Root/ViewContextContext';
import { trackEvent } from '../../util';

class WidgetErrorHandler extends Component {
	constructor( props ) {
		super( props );

		this.state = {
			error: null,
			info: null,
		};

		this.onErrorClick = this.onErrorClick.bind( this );
	}

	componentDidCatch( error, info ) {
		global.console.error( 'Widget error:', error, info );

		this.setState( { error, info } );

		trackEvent(
			'widget_error',
			`handle_${ this.context || 'unknown' }_error`,
			// label has a max-length of 500 bytes.
			`${ this.props.slug }_${ error?.message }\n${ info?.componentStack }`.slice(
				0,
				500 - this.props.slug.length - 1
			)
		);
	}

	onErrorClick() {
		const { error, info } = this.state;

		// Copy message with wrapping backticks for code block formatting on wp.org.
		copyToClipboard( `\`${ error?.message }\n${ info?.componentStack }\`` );
	}

	render() {
		const { children } = this.props;
		const { error, info } = this.state;

		// If there is no caught error, render the children components normally.
		if ( ! error ) {
			return children;
		}

		return (
			<div className="googlesitekit-widget-error-handler">
				<CTA
					description={
						<Fragment>
							<p>
								{ __(
									'An error prevented this Widget from being displayed properly. Report the exact contents of the error on the support forum to find out what caused it.',
									'google-site-kit'
								) }
							</p>
							<GenericErrorHandlerActions
								message={ error.message }
								componentStack={ info.componentStack }
							/>
						</Fragment>
					}
					error
					onErrorClick={ this.onErrorClick }
					onClick={ this.onErrorClick }
					title={ __( 'Error in Widget', 'google-site-kit' ) }
				/>
			</div>
		);
	}
}

WidgetErrorHandler.contextType = ViewContextContext;

WidgetErrorHandler.propTypes = {
	/** @ignore */
	children: PropTypes.node.isRequired,
};

export default WidgetErrorHandler;
