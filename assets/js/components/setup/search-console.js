/**
 * SearchConsole component.
 *
 * Site Kit by Google, Copyright 2019 Google LLC
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
import data, { TYPE_MODULES } from 'GoogleComponents/data';
import ProgressBar from 'GoogleComponents/progress-bar';
import { Select, TextField, Input } from 'SiteKitCore/material-components';
import PropTypes from 'prop-types';
import Button from 'SiteKitCore/components/button';
import HelpLink from 'GoogleComponents/help-link';
import { sendAnalyticsTrackingEvent } from 'GoogleUtil';

/**
 * WordPress dependencies
 */
import { __, _x, sprintf } from '@wordpress/i18n';
import { Component, Fragment } from '@wordpress/element';

class SearchConsole extends Component {
	constructor( props ) {
		super( props );

		const { siteURL } = googlesitekit.admin;

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
		this.insertPropertyToSearchConsole = this.insertPropertyToSearchConsole.bind( this );
		this.submitPropertyEventHandler = this.submitPropertyEventHandler.bind( this );
	}

	async componentDidMount() {
		const { isAuthenticated, shouldSetup } = this.props;

		if ( ! isAuthenticated || ! shouldSetup ) {
			return;
		}

		try {
			const sufficientPermissionLevels = [ 'siteRestrictedUser', 'siteOwner', 'siteFullUser' ];
			const { exactMatch } = await data.get( TYPE_MODULES, 'search-console', 'matched-sites' );

			if ( exactMatch && sufficientPermissionLevels.includes( exactMatch.permissionLevel ) ) {
				await data.set( TYPE_MODULES, 'search-console', 'site', { siteURL: exactMatch.siteURL } );

				return this.props.searchConsoleSetup( exactMatch.siteURL );
			}
		} catch {}

		// Fallback to request match sites and exact match site.
		this.requestSearchConsoleSiteList();
	}

	/**
	 * Request match sites and exact match site to search console API services
	 */
	requestSearchConsoleSiteList() {
		const { errorCode } = this.state;
		if ( errorCode ) {
			return;
		}
		const { setErrorMessage } = this.props;
		( async () => {
			try {
				const { exactMatch, propertyMatches } = await data.get( TYPE_MODULES, 'search-console', 'matched-sites' );

				// We found exact match, continue the process in the background.
				if ( exactMatch ) {
					await this.insertPropertyToSearchConsole( exactMatch.siteURL );

					// We have everything we need here. go to next step.
					this.props.searchConsoleSetup( exactMatch.siteURL );

					return;
				}

				let errorMessage = '';
				if ( 1 < propertyMatches.length ) {
					errorMessage = sprintf(
						/* translators: %d: the number of matching properties. %s: URL of recommended site. */
						__( 'We found %d existing accounts. We recommend using the account “%s”. Please confirm or change below to use.', 'google-site-kit' ),
						propertyMatches.length,
						propertyMatches[ 0 ].siteURL
					);
				} else {
					errorMessage = __( 'Your site has not been added to Search Console yet. Would you like to add it now?', 'google-site-kit' );
				}

				setErrorMessage( errorMessage );
				this.setState( {
					loading: false,
					sites: propertyMatches,
					errorCode: 'no_property_matched',
					errorMsg: errorMessage,
				} );
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
	 * Insert siteURL to the option through the API
	 * @param { string } siteURL
	 */
	async insertPropertyToSearchConsole( siteURL ) {
		await data.set( TYPE_MODULES, 'search-console', 'site', { siteURL } );
		sendAnalyticsTrackingEvent( 'search_console_setup', 'add_new_sc_property' );

		this.setState( {
			loading: false,
			connected: true,
		} );
	}

	/**
	 * Event handler to set site url to option.
	 */
	submitPropertyEventHandler() {
		const siteURL = this.state.selectedURL;
		const { setErrorMessage } = this.props;

		( async () => {
			try {
				await this.insertPropertyToSearchConsole( siteURL );

				setErrorMessage( '' );
				this.props.searchConsoleSetup( siteURL );
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

		const sitesList = [
			{ /* Required for initial placeholder. */
				label: '',
				value: '',
				disabled: true,
			},
		];

		if ( ! sites ) {
			return null;
		}

		sites.forEach( function( site ) {
			sitesList.push( {
				label: site,
				value: site,
			} );
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
					<Button onClick={ this.submitPropertyEventHandler }>{ __( 'Continue', 'google-site-kit' ) }</Button>
					<HelpLink />
				</div>
			</Fragment>
		);
	}

	static connected() {
		return (
			<section className="googlesitekit-setup-module googlesitekit-setup-module--search-console">
				<h2 className="
					googlesitekit-heading-3
					googlesitekit-setup-module__title
				">
					{ _x( 'Search Console', 'Service name', 'google-site-kit' ) }
				</h2>
				<p className="googlesitekit-setup-module__text--no-margin">{ __( 'Your Search Console is set up with Site Kit.', 'google-site-kit' ) }</p>
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
						floatingLabelClassName="mdc-floating-label--float-above"
						outlined
						disabled
					>
						<Input
							value={ siteURL }
						/>
					</TextField>
				</div>
				<div className="googlesitekit-wizard-step__action googlesitekit-wizard-step__action--justify">
					<Button onClick={ this.submitPropertyEventHandler }>{ __( 'Continue', 'google-site-kit' ) }</Button>
					<HelpLink />
				</div>
			</Fragment>
		);
	}

	renderForm() {
		const { loading, sites } = this.state;

		if ( loading ) {
			return (
				<Fragment>
					<p>{ __( 'We’re locating your Search Console account.', 'google-site-kit' ) }</p>
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
		const {
			isAuthenticated,
			shouldSetup,
		} = this.props;
		const {
			errorMsg,
			connected,
		} = this.state;

		if ( ! shouldSetup || connected ) {
			return SearchConsole.connected();
		}

		return (
			<section className="googlesitekit-setup-module googlesitekit-setup-module--search-console">
				<h2 className="
					googlesitekit-heading-3
					googlesitekit-setup-module__title
				">
					{ _x( 'Search Console', 'Service name', 'google-site-kit' ) }
				</h2>

				{
					errorMsg && 0 < errorMsg.length &&
					<p className="googlesitekit-error-text">
						{ errorMsg }
					</p>
				}

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
