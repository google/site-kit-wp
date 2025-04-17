/**
 * SearchConsole component.
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
import { __, _x, sprintf } from '@wordpress/i18n';
import { Component, Fragment } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { get, set } from 'googlesitekit-api';
import {
	Button,
	ProgressBar,
	Select,
	TextField,
} from 'googlesitekit-components';
import { trackEvent } from '../../util';

class SearchConsole extends Component {
	constructor( props ) {
		super( props );

		const { siteURL } = global._googlesitekitLegacyData.admin;

		this.state = {
			loading: true,
			sites: false,
			selectedURL: siteURL,
			siteURL,
			connected: false,
			errorCode: false,
			errorMsg: '',
		};

		this.handleURLSelect = this.handleURLSelect.bind( this );
		this.insertPropertyToSearchConsole =
			this.insertPropertyToSearchConsole.bind( this );
		this.submitPropertyEventHandler =
			this.submitPropertyEventHandler.bind( this );
	}

	componentDidMount() {
		const { isAuthenticated, shouldSetup } = this.props;

		if ( ! isAuthenticated || ! shouldSetup ) {
			return;
		}

		this.requestSearchConsoleSiteList();
	}

	/**
	 * Request list of matching sites for search console API services.
	 */
	requestSearchConsoleSiteList() {
		const { setErrorMessage } = this.props;
		( async () => {
			try {
				const properties = await get(
					'modules',
					'search-console',
					'matched-sites',
					undefined,
					{ useCache: false }
				);

				// We found exact match, continue the process in the background.
				if ( properties.length === 1 ) {
					await this.insertPropertyToSearchConsole(
						properties[ 0 ].siteURL
					);

					// We have everything we need here. go to next step.
					this.props.searchConsoleSetup( properties[ 0 ].siteURL );
					return;
				}

				if ( ! properties.length ) {
					throw {
						code: 'no_property_matched',
						message: __(
							'Your site has not been added to Search Console yet. Would you like to add it now?',
							'google-site-kit'
						),
					};
				}

				setErrorMessage( '' );
				this.setState( {
					loading: false,
					selectedURL: properties[ 0 ].siteURL,
					sites: properties,
				} );
				throw {
					code: 'multiple_properties_matched',
					message: sprintf(
						/* translators: %s: the number of matching properties */
						__(
							'We found %d existing accounts. Please choose which one to use below.',
							'google-site-kit'
						),
						properties.length
					),
				};
			} catch ( err ) {
				setErrorMessage( err.message );
				this.setState( {
					loading: false,
					errorCode: err.code,
					errorMsg: err.message,
				} );
			}
		} )();
	}

	/**
	 * Sets the Search Console property and adds it if necessary through the API.
	 *
	 * @since 1.3.0
	 *
	 * @param {string}  siteURL The siteURL for the property.
	 * @param {boolean} isNew   Whether siteURL is for a new property.
	 */
	async insertPropertyToSearchConsole( siteURL, isNew = false ) {
		await set( 'modules', 'search-console', 'site', { siteURL } );

		if ( isNew ) {
			await trackEvent( 'search_console_setup', 'add_new_sc_property' );
		}

		this.setState( {
			loading: false,
			connected: true,
		} );
	}

	/**
	 * Event handler to set site url to option.
	 */
	submitPropertyEventHandler() {
		const { selectedURL, errorCode } = this.state;
		const { setErrorMessage } = this.props;

		( async () => {
			try {
				await this.insertPropertyToSearchConsole(
					selectedURL,
					errorCode === 'no_property_matched'
				);

				setErrorMessage( '' );
				this.props.searchConsoleSetup( selectedURL );
			} catch ( err ) {
				setErrorMessage( err.message[ 0 ].message );
				this.setState( {
					loading: false,
					errorCode: err.code,
					errorMsg: err.message[ 0 ].message,
				} );
			}
		} )();
	}

	handleURLSelect( index, item ) {
		this.setState( {
			selectedURL: item.getAttribute( 'data-value' ),
		} );
	}

	matchedForm() {
		const { sites, selectedURL } = this.state;

		if ( ! sites ) {
			return null;
		}

		const sitesList = sites.map( ( site ) => {
			let label = site.siteURL;
			if ( label.startsWith( 'sc-domain:' ) ) {
				label = sprintf(
					/* translators: %s: Search Console property domain name */
					__( '%s (domain property)', 'google-site-kit' ),
					label.replace( /^sc-domain:/, '' )
				);
			}

			return {
				label,
				value: site.siteURL,
			};
		} );

		return (
			<Fragment>
				<div className="googlesitekit-setup-module__inputs">
					<Select
						enhanced
						name="siteProperty"
						label={ __( 'Choose URL', 'google-site-kit' ) }
						outlined
						onEnhancedChange={ this.handleURLSelect }
						options={ sitesList }
						value={ selectedURL }
					/>
				</div>
				<div className="googlesitekit-wizard-step__action googlesitekit-wizard-step__action--justify">
					<Button onClick={ this.submitPropertyEventHandler }>
						{ __( 'Continue', 'google-site-kit' ) }
					</Button>
				</div>
			</Fragment>
		);
	}

	static connected() {
		return (
			<section className="googlesitekit-setup-module googlesitekit-setup-module--search-console">
				<h2
					className="
					googlesitekit-heading-3
					googlesitekit-setup-module__title
				"
				>
					{ _x(
						'Search Console',
						'Service name',
						'google-site-kit'
					) }
				</h2>
				<p className="googlesitekit-setup-module__text--no-margin">
					{ __(
						'Your Search Console is set up with Site Kit.',
						'google-site-kit'
					) }
				</p>
				{ /* TODO This needs a continue button or redirect. */ }
			</section>
		);
	}

	noSiteForm() {
		const { siteURL } = this.state;

		return (
			<Fragment>
				<div className="googlesitekit-setup-module__inputs">
					<TextField
						label={ __( 'Website Address', 'google-site-kit' ) }
						name="siteProperty"
						outlined
						value={ siteURL }
					/>
				</div>
				<div className="googlesitekit-wizard-step__action googlesitekit-wizard-step__action--justify">
					<Button onClick={ this.submitPropertyEventHandler }>
						{ __( 'Continue', 'google-site-kit' ) }
					</Button>
				</div>
			</Fragment>
		);
	}

	renderForm() {
		const { loading, sites } = this.state;

		if ( loading ) {
			return (
				<Fragment>
					<p>
						{ __(
							'We’re locating your Search Console account.',
							'google-site-kit'
						) }
					</p>
					<ProgressBar />
				</Fragment>
			);
		}

		if ( 0 === sites.length ) {
			return this.noSiteForm();
		}

		return this.matchedForm();
	}

	render() {
		const { isAuthenticated, shouldSetup } = this.props;
		const { errorMsg, connected } = this.state;

		if ( ! shouldSetup || connected ) {
			return SearchConsole.connected();
		}

		return (
			<section className="googlesitekit-setup-module googlesitekit-setup-module--search-console">
				<h2
					className="
					googlesitekit-heading-3
					googlesitekit-setup-module__title
				"
				>
					{ _x(
						'Search Console',
						'Service name',
						'google-site-kit'
					) }
				</h2>

				{ errorMsg && 0 < errorMsg.length && (
					<p className="googlesitekit-error-text">{ errorMsg }</p>
				) }

				{ isAuthenticated && shouldSetup && this.renderForm() }
			</section>
		);
	}
}

SearchConsole.propTypes = {
	isAuthenticated: PropTypes.bool.isRequired,
	shouldSetup: PropTypes.bool.isRequired,
	searchConsoleSetup: PropTypes.func.isRequired,
	setErrorMessage: PropTypes.func.isRequired,
};

export default SearchConsole;
