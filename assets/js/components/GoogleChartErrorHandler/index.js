/**
 * GoogleChartErrorHandler component.
 *
 * Site Kit by Google, Copyright 2023 Google LLC
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
import { Button } from 'googlesitekit-components';
import Link from '../Link';
import CTA from '../notifications/CTA';

class GoogleChartErrorHandler extends Component {
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
		global.console.error( 'Google Charts error:', error, info );

		this.setState( { error, info } );
	}

	onErrorClick() {
		const { error, info } = this.state;

		// Copy message with wrapping backticks for code block formatting on wp.org.
		copyToClipboard( `\`${ error?.message }\n${ info?.componentStack }\`` );

		this.setState( { copied: true } );
	}

	render() {
		const { children } = this.props;
		const { error, copied } = this.state;

		// If there is no caught error, render the children components normally.
		if ( ! error ) {
			return children;
		}

		const icon = (
			<Icon
				className="mdc-button__icon"
				icon={ copied ? check : stack }
			/>
		);

		return (
			<div className="googlesitekit-googlechart-error-handler">
				<CTA
					description={
						<Fragment>
							<p>
								{ __(
									'An error prevented this Google chart from being displayed properly. Report the exact contents of the error on the support forum to find out what caused it.',
									'google-site-kit'
								) }
							</p>
							<Button
								aria-label={ __(
									'Error message copied to clipboard. Click to copy the error message again.',
									'google-site-kit'
								) }
								onClick={ this.onErrorClick }
								trailingIcon={ icon }
							>
								{ copied
									? __(
											'Error copied to clipboard',
											'google-site-kit'
									  )
									: __(
											'Copy error contents',
											'google-site-kit'
									  ) }
							</Button>
							<Link
								href="https://wordpress.org/support/plugin/google-site-kit/"
								arrow
								external
							>
								{ __( 'Report this error', 'google-site-kit' ) }
							</Link>
						</Fragment>
					}
					error
					onErrorClick={ this.onErrorClick }
					onClick={ this.onErrorClick }
					title={ __( 'Error in Google Chart', 'google-site-kit' ) }
				/>
			</div>
		);
	}
}

GoogleChartErrorHandler.propTypes = {
	/** @ignore */
	children: PropTypes.node.isRequired,
};

export default GoogleChartErrorHandler;
