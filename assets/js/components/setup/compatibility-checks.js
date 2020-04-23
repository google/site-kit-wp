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
import { Component, Fragment } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * External dependencies
 */
import PropTypes from 'prop-types';

/**
 * Internal dependencies
 */
import Warning from '../notifications/warning';
import ProgressBar from '../../components/progress-bar';

/**
 * Internal dependencies
 */
import { getExistingTag } from '../../util';
import data, { TYPE_CORE } from '../data';
import Link from '../link';

const ERROR_INVALID_HOSTNAME = 'invalid_hostname';
const ERROR_FETCH_FAIL = 'tag_fetch_failed';
const ERROR_TOKEN_MISMATCH = 'setup_token_mismatch';

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
		const { token } = await data.set( TYPE_CORE, 'site', 'setup-tag' );

		const scrapedTag = await getExistingTag( 'setup' ).catch( () => {
			throw ERROR_FETCH_FAIL;
		} );

		if ( token !== scrapedTag ) {
			throw ERROR_TOKEN_MISMATCH;
		}
	},
];

export default class CompatibilityChecks extends Component {
	constructor( props ) {
		const { isSiteKitConnected } = global.googlesitekit.setup;
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
			const developerPlugin = await data.get( TYPE_CORE, 'site', 'developer-plugin' );
			this.setState( { error, developerPlugin } );
		}

		this.setState( { complete: true } );
	}

	helperCTA() {
		const { installed, active, installURL, activateURL, configureURL } = this.state.developerPlugin;

		if ( ! installed && installURL ) {
			return {
				labelHTML: __( 'Install<span class="screen-reader-text"> the helper plugin</span>', 'google-site-kit' ),
				href: installURL,
				external: false,
			};
		}
		if ( installed && ! active && activateURL ) {
			return {
				labelHTML: __( 'Activate<span class="screen-reader-text"> the helper plugin</span>', 'google-site-kit' ),
				href: activateURL,
				external: false,
			};
		}
		if ( installed && active && configureURL ) {
			return {
				labelHTML: __( 'Configure<span class="screen-reader-text"> the helper plugin</span>', 'google-site-kit' ),
				href: configureURL,
				external: false,
			};
		}
		return {
			labelHTML: __( 'Learn how<span class="screen-reader-text"> to install and use the helper plugin</span>', 'google-site-kit' ),
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
				return <Fragment>
					{ ! installed && __( 'Looks like this may be a staging environment. If so, you’ll need to install a helper plugin and verify your production site in Search Console.', 'google-site-kit' ) }
					{ installed && __( 'Looks like this may be a staging environment and you already have the helper plugin. Before you can use Site Kit, please make sure you’ve provided the necessary credentials in the Authentication section and verified your production site in Search Console.', 'google-site-kit' ) }
					{ ' ' }
					<Link
						href={ href }
						dangerouslySetInnerHTML={ { __html: labelHTML } }
						external={ external }
						inherit
					/>
				</Fragment>;
			case ERROR_TOKEN_MISMATCH:
				return __( 'Looks like you may be using a caching plugin which could interfere with setup. Please deactivate any caching plugins before setting up Site Kit. You may reactivate them once setup has been completed.', 'google-site-kit' );
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
					<p>{ this.renderError( error ) }</p>
				</div>
			</Fragment>;
		}

		if ( ! complete ) {
			inProgressFeedback = <div style={ { alignSelf: 'center', marginLeft: '1rem' } }>
				<small>{ __( 'Checking Compatibility...', 'google-site-kit' ) }</small>
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
