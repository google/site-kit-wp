/**
 * Adminbar component.
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

/* eslint camelcase:[0] */

/**
 * External dependencies
 */
import Link from 'GoogleComponents/link';
import {
	decodeHtmlEntity,
	getSiteKitAdminURL,
	sendAnalyticsTrackingEvent,
} from 'GoogleUtil';

const { doAction } = wp.hooks;
const { Component, Fragment, render } = wp.element;
const { __ } = wp.i18n;

/**
 * Internal dependencies.
 */
import AdminbarModules from 'GoogleComponents/adminbar/adminbar-modules';

export class GoogleSitekitAdminbar extends Component {
	constructor( props ) {
		super( props );
		const { setLocaleData } = wp.i18n;

		// Set up translations.
		setLocaleData( googlesitekit.locale, 'google-site-kit' );

		this.handleMoreDetailsLink = this.handleMoreDetailsLink.bind( this );
	}

	handleMoreDetailsLink() {
		const {
			permaLink,
			postID,
			postType,
			pageTitle,
		} = googlesitekit;
		const href = getSiteKitAdminURL(
			'googlesitekit-dashboard',
			{
				permaLink,
				id: postID,
				postType,
				pageTitle,
			}
		);

		sendAnalyticsTrackingEvent( 'admin_bar', 'post_details_click' );
		document.location = href;
	}

	render() {
		const {
			pageTitle,
			permaLink,
		} = googlesitekit;

		return (
			<Fragment>
				<div className="mdc-layout-grid">
					<div className="mdc-layout-grid__inner">
						<div className="
							mdc-layout-grid__cell
							mdc-layout-grid__cell--span-3
							mdc-layout-grid__cell--align-middle
						">
							<span className="googlesitekit-adminbar__subtitle">{ __( 'Stats for:', 'google-site-kit' ) }</span>
							<h2 className="googlesitekit-adminbar__title">
								{ pageTitle ?
									decodeHtmlEntity( pageTitle ) :
									permaLink
								}
							</h2>
						</div>
						<div className="
							mdc-layout-grid__cell
							mdc-layout-grid__cell--span-8-tablet
							mdc-layout-grid__cell--span-7-desktop
							mdc-layout-grid__cell--align-middle
						">
							<div className="mdc-layout-grid__inner">
								<AdminbarModules />
							</div>
						</div>
						<div className="
							mdc-layout-grid__cell
							mdc-layout-grid__cell--span-2
							mdc-layout-grid__cell--align-middle
						">
							<Link
								className="googlesitekit-adminbar__link"
								href="#"
								onClick={ this.handleMoreDetailsLink }
							>
								{ __( 'More details', 'google-site-kit' ) }
							</Link>
						</div>
					</div>
				</div>
				<Link
					className="googlesitekit-adminbar__link googlesitekit-adminbar__link--mobile"
					href="#"
					onClick={ this.handleMoreDetailsLink }
				>
					{ __( 'More details', 'google-site-kit' ) }
				</Link>
			</Fragment>
		);
	}
}

// Initialize the whole adminbar app.
export function init() {
	const adminbarModules = document.getElementById( 'js-googlesitekit-adminbar-modules' );
	if ( null !== adminbarModules ) {
		// Render the Adminbar App.
		render( <GoogleSitekitAdminbar />, document.getElementById( 'js-googlesitekit-adminbar-modules' ) );

		/**
		 * Action triggered when the dashboard App is loaded.
		 */
		doAction( 'googlesitekit.moduleLoaded', 'Adminbar' );
	}
}
