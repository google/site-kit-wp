/**
 * TagmanagerSetup component.
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

import Button from 'GoogleComponents/button';
import Link from 'GoogleComponents/link';
import data from 'GoogleComponents/data';
import PropTypes from 'prop-types';

import { Input, TextField } from 'SiteKitCore/material-components';
import { sendAnalyticsTrackingEvent } from 'GoogleUtil';
import { getSiteKitAdminURL } from 'GoogleUtil';

const { __ } = wp.i18n;
const { Component, Fragment } = wp.element;

class PageSpeedInsightsSetup extends Component {

	constructor( props ) {
		super( props );
		this.state = {
			apikey: '',
			disabled: true,
		};

		this.handleAPIKeyChange = this.handleAPIKeyChange.bind( this );
		this.handleAPIKeyEntry  = this.handleAPIKeyEntry.bind( this );
		this.handleEditKeyClick = this.handleEditKeyClick.bind( this );
	}

	componentDidMount() {
		const apikey       = googlesitekit.admin.settings ? googlesitekit.admin.settings.apikey : '';
		const disabled     = ! apikey || 0 === apikey.length;
		const editing      = disabled;
		const startedEmpty = disabled;

		// Load the inital value.
		this.setState( {
			apikey,
			disabled,
			editing,
			startedEmpty,
		} );
	}

	async handleAPIKeyEntry() {
		const {
			apikey,
			startedEmpty,
		} = this.state;

		sendAnalyticsTrackingEvent( 'plugin_setup', 'apikey_entered' );

		// Save the API key.
		try {
			await data.set( 'core', 'site', 'apikey', { apikey } );

			// If the API key was previously unconfigured, continue to the dashboard.
			if ( startedEmpty ) {
				document.location = getSiteKitAdminURL( 'googlesitekit-dashboard' );
			} else {

				// Otherwise, end the edit mode.
				this.setState( { editing: false } );
			}
		} catch ( err ) {
			throw err;
		}
	}

	handleEditKeyClick() {
		this.setState( { editing: true } );
	}

	handleAPIKeyChange( e ) {
		this.setState( {
			apikey: e.currentTarget.value.replace( /\s/g, '' ),
			disabled: 0 === e.currentTarget.value.length,
		} );
	}

	render() {
		const { externalAPIKeyURL } = googlesitekit.admin;
		const {
			apikey,
			disabled,
			editing,
			startedEmpty,
		} = this.state;

		const {
			onSettingsPage,
		} = this.props;

		const externalAPIKeyURLLabel = 'developers.google.com/web/sitekit/apikey';

		return (
			<div className="googlesitekit-setup-module googlesitekit-setup-module--pagespeed-insights">
				{
					! onSettingsPage &&
					<Fragment>
						<div className="googlesitekit-setup-module__logo">
							<img src={ googlesitekit.admin.assetsRoot + 'images/icon-pagespeed.png' } width={ 33 } alt=""/>
						</div>
						<h2 className="
							googlesitekit-heading-3
							googlesitekit-setup-module__title
						">
							{ __( 'PageSpeed Insights', 'google-site-kit' ) }
						</h2>
					</Fragment>
				}

				{
					! editing ?
						<p>
							{ __( 'API connected.', 'google-site-kit' ) } <Link
								href="#"
								onClick={ this.handleEditKeyClick }
								inherit
							>
								{ __( 'Edit key', 'google-site-kit' ) }
							</Link>
						</p> :
						<Fragment>
							{ startedEmpty &&
								<Fragment>
									<p>
										{ __( 'Please generate an API key on ', 'google-site-kit' ) }
										<Link
											href= { externalAPIKeyURL }
											target="_blank"
											rel="noopener noreferrer"
											external
											inherit
										>
											{ externalAPIKeyURLLabel }
										</Link>
									</p>
									<p>{ __( 'Enter it below to complete the setup for PageSpeed Insights.', 'google-site-kit' ) }</p>
								</Fragment>
							}
							<div className="googlesitekit-setup-module__inputs">
								<TextField
									label={ __( 'API Key', 'google-site-kit' ) }
									name="apiKey"
									outlined
									required
								>
									<Input
										value={ apikey ? apikey : '' }
										onChange={ this.handleAPIKeyChange }
										autoComplete="off"
									/>
								</TextField>
							</div>
							<Button
								onClick={ this.handleAPIKeyEntry }
								disabled={ disabled }
							>
								{ startedEmpty ? __( 'Proceed', 'google-site-kit' ) : __( 'Save', 'google-site-kit' ) }
							</Button>
						</Fragment>
				}

			</div>
		);
	}
}

PageSpeedInsightsSetup.propTypes = {
	onSettingsPage: PropTypes.bool,
	finishSetup: PropTypes.func,
	isEditing: PropTypes.bool,
};

PageSpeedInsightsSetup.defaultProps = {
	onSettingsPage: true,
	isEditing: false,
};

export default PageSpeedInsightsSetup;
