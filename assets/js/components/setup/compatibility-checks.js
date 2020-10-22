/**
 * CompatibilityChecks component.
 *
 * Site Kit by Google, Copyright 2020 Google LLC
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
 * WordPress dependencies
 */
import { Component, createInterpolateElement, Fragment } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';

/**
 * External dependencies
 */
import PropTypes from 'prop-types';

/**
 * Internal dependencies
 */
import API from 'googlesitekit-api';
import { sanitizeHTML } from '../../util/sanitize';
import { getExistingTag } from '../../util/tag';
import Link from '../link';
import Warning from '../notifications/warning';
import ProgressBar from '../../components/progress-bar';

const ERROR_INVALID_HOSTNAME = 'invalid_hostname';
const ERROR_FETCH_FAIL = 'check_fetch_failed';
const ERROR_TOKEN_MISMATCH = 'setup_token_mismatch';
const ERROR_GOOGLE_API_CONNECTION_FAIL = 'google_api_connection_fail';
const ERROR_AMP_CDN_RESTRICTED = 'amp_cdn_restricted';

export const AMP_PROJECT_TEST_URL = 'https://cdn.ampproject.org/v0.js';

const checks = [
	// Check for a known non-public/reserved domain.
	async () => {
		const { hostname } = global.location;

		if ( [ 'localhost', '127.0.0.1' ].includes( hostname ) || hostname.match( /\.(example|invalid|localhost|test)$/ ) ) {
			throw ERROR_INVALID_HOSTNAME;
		}
	},
	// Generate and check for a Site Kit specific meta tag on the page to test for agressive caching.
	async () => {
		const { token } = await API.set( 'core', 'site', 'setup-tag' );

		const scrapedTag = await getExistingTag( 'setup' ).catch( () => {
			throw ERROR_FETCH_FAIL;
		} );

		if ( token !== scrapedTag ) {
			throw ERROR_TOKEN_MISMATCH;
		}
	},
	// Check that server can connect to Google's APIs via the core/site/data/health-checks endpoint.
	async () => {
		const response = await API.get( 'core', 'site', 'health-checks', undefined, {
			useCache: false,
		} ).catch( () => {
			throw ERROR_FETCH_FAIL;
		} );

		if ( ! response?.checks?.googleAPI?.pass ) {
			throw ERROR_GOOGLE_API_CONNECTION_FAIL;
		}
	},
	// Check that client can connect to AMP Project.
	async () => {
		const response = await fetch( AMP_PROJECT_TEST_URL ).catch( () => {
			throw ERROR_AMP_CDN_RESTRICTED;
		} );

		if ( ! response.ok ) {
			throw ERROR_AMP_CDN_RESTRICTED;
		}
	},
];

export default class CompatibilityChecks extends Component {
	constructor( props ) {
		const { isSiteKitConnected } = global._googlesitekitLegacyData.setup;
		super( props );
		this.state = {
			complete: isSiteKitConnected,
			error: null,
			developerPlugin: {},
		};
	}

	async componentDidMount() {
		if ( this.state.complete ) {
			return;
		}
		try {
			for ( const testCallback of checks ) {
				await testCallback();
			}
		} catch ( error ) {
			const developerPlugin = await API.get( 'core', 'site', 'developer-plugin' );
			this.setState( { error, developerPlugin } );
		}

		this.setState( { complete: true } );
	}

	helperCTA() {
		const { installed, active, installURL, activateURL, configureURL } = this.state.developerPlugin;

		if ( ! installed && installURL ) {
			return {
				labelHTML: createInterpolateElement(
					__( 'Install<span> the helper plugin</span>', 'google-site-kit' ),
					{
						span: <span className="screen-reader-text" />,
					}
				),
				href: installURL,
				external: false,
			};
		}
		if ( installed && ! active && activateURL ) {
			return {
				labelHTML: createInterpolateElement(
					__( 'Activate<span> the helper plugin</span>', 'google-site-kit' ),
					{
						span: <span className="screen-reader-text" />,
					}
				),
				href: activateURL,
				external: false,
			};
		}
		if ( installed && active && configureURL ) {
			return {
				labelHTML: createInterpolateElement(
					__( 'Configure<span> the helper plugin</span>', 'google-site-kit' ),
					{
						span: <span className="screen-reader-text" />,
					}
				),
				href: configureURL,
				external: false,
			};
		}
		return {
			labelHTML: createInterpolateElement(
				__( 'Learn how<span> to install and use the helper plugin</span>', 'google-site-kit' ),
				{
					span: <span className="screen-reader-text" />,
				}
			),
			href: 'https://sitekit.withgoogle.com/documentation/using-site-kit-on-a-staging-environment/',
			external: true,
		};
	}

	renderError( error ) {
		const { installed } = this.state.developerPlugin;
		const { labelHTML, href, external } = this.helperCTA();

		switch ( error ) {
			case ERROR_INVALID_HOSTNAME:
			case ERROR_FETCH_FAIL:
				return <p>
					{ ! installed && __( 'Looks like this may be a staging environment. If so, you’ll need to install a helper plugin and verify your production site in Search Console.', 'google-site-kit' ) }
					{ installed && __( 'Looks like this may be a staging environment and you already have the helper plugin. Before you can use Site Kit, please make sure you’ve provided the necessary credentials in the Authentication section and verified your production site in Search Console.', 'google-site-kit' ) }
					{ ' ' }
					<Link
						href={ href }
						external={ external }
						inherit
					>
						{ labelHTML }
					</Link>
				</p>;
			case ERROR_TOKEN_MISMATCH:
				return <p>
					{ __( 'Looks like you may be using a caching plugin which could interfere with setup. Please deactivate any caching plugins before setting up Site Kit. You may reactivate them once setup has been completed.', 'google-site-kit' ) }
				</p>;
			case ERROR_GOOGLE_API_CONNECTION_FAIL:
				return <Fragment>
					<p
						dangerouslySetInnerHTML={ sanitizeHTML(
							`
							${ __( 'Looks like your site is having a technical issue with requesting data from Google services.', 'google-site-kit' ) }
							<br/>
							${ sprintf(
								/* translators: %1$s: Support Forum URL, %2$s: Error message */ // eslint-disable-line indent
								__( 'To get more help, ask a question on our <a href="%1$s">support forum</a> and include the text of the original error message: %2$s', 'google-site-kit' ), // eslint-disable-line indent
								'https://wordpress.org/support/plugin/google-site-kit/', // eslint-disable-line indent
								`<br/>${ error }` // eslint-disable-line indent
							) /* eslint-disable-line indent */ }
							`,
							{
								ALLOWED_TAGS: [ 'a', 'br' ],
								ALLOWED_ATTR: [ 'href' ],
							}
						) }
					/>
				</Fragment>;
			case ERROR_AMP_CDN_RESTRICTED:
				return <Fragment>
					<p
						dangerouslySetInnerHTML={ sanitizeHTML(
							`
							${ __( 'Looks like the AMP CDN is restricted in your region, which could interfere with setup on the Site Kit service.', 'google-site-kit' ) }
							<br/>
							${ sprintf(
								/* translators: %1$s: Support Forum URL, %2$s: Error message */ // eslint-disable-line indent
								__( 'To get more help, ask a question on our <a href="%1$s">support forum</a> and include the text of the original error message: %2$s', 'google-site-kit' ), // eslint-disable-line indent
								'https://wordpress.org/support/plugin/google-site-kit/', // eslint-disable-line indent
								`<br/>${ error }` // eslint-disable-line indent
							) /* eslint-disable-line indent */ }
							`,
							{
								ALLOWED_TAGS: [ 'a', 'br' ],
								ALLOWED_ATTR: [ 'href' ],
							}
						) }
					/>
				</Fragment>;
		}
	}

	render() {
		const { complete, error } = this.state;
		const { children, ...restProps } = this.props;

		let CTAFeedback;
		let inProgressFeedback;

		if ( error ) {
			CTAFeedback = <Fragment>
				<div className="googlesitekit-setup-compat mdc-layout-grid mdc-layout-grid--align-left">
					<div className="mdc-layout-grid__inner">
						<Warning />
						<div className="googlesitekit-heading-4 mdc-layout-grid__cell--span-11">
							{ __( 'Your site may not be ready for Site Kit', 'google-site-kit' ) }
						</div>
					</div>
					{ this.renderError( error ) }
				</div>
			</Fragment>;
		}

		if ( ! complete ) {
			inProgressFeedback = <div style={ { alignSelf: 'center', marginLeft: '1rem' } }>
				<small>{ __( 'Checking Compatibility…', 'google-site-kit' ) }</small>
				<ProgressBar small compress />
			</div>;
		}

		return children( {
			restProps,
			complete,
			error,
			inProgressFeedback,
			CTAFeedback,
		} );
	}
}

CompatibilityChecks.propTypes = {
	children: PropTypes.func.isRequired,
};
