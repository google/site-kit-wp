/**
 * PageSpeedInsightsDashboardWidgetHomepageSpeed component.
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
 * Internal dependencies
 */
import {
	PageSpeedInsightsDashboardWidgetHomepageSpeedDesktop,
	PageSpeedInsightsDashboardWidgetHomepageSpeedMobile,
} from './dashboard-widget-homepage-speed-column';
/**
 * External dependencies
 */
import SourceLink from 'GoogleComponents/source-link';
import { PageSpeedReportScale } from './util';
import ProgressBar from 'GoogleComponents/progress-bar';
import getDataErrorComponent from 'GoogleComponents/notifications/data-error';

/**
 * WordPress dependencies
 */
import { Component, Fragment } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';

class PageSpeedInsightsDashboardWidgetHomepageSpeed extends Component {
	constructor( props ) {
		super( props );
		this.state = {
			loading: true,
			error: false,
		};
		this.handleDataLoaded = this.handleDataLoaded.bind( this );
		this.handleDataError = this.handleDataError.bind( this );
	}

	handleDataLoaded() {
		this.setState( {
			loading: false,
		} );
	}

	handleDataError( error ) {
		this.setState( {
			error,
		} );
	}

	render() {
		const {
			loading,
			error,
		} = this.state;

		const source = {
			name: __( 'PageSpeed Insights', 'google-site-kit' ),
			link: sprintf( 'https://developers.google.com/speed/pagespeed/insights/?url=%s', googlesitekit.admin.siteURL ),
		};

		if ( error ) {
			return (
				<div className="
					mdc-layout-grid__cell
					mdc-layout-grid__cell--span-12
				">
					{
						getDataErrorComponent(
							__( 'PageSpeed Insights', 'google-site-kit' ),
							error,
							true,
							true,
							false
						)
					}
				</div>
			);
		}

		return (
			<Fragment>
				{ loading &&
					<div className="
						mdc-layout-grid__cell
						mdc-layout-grid__cell--span-12
					">
						<div className="googlesitekit-pagespeed-report__loading">
							<ProgressBar />
							<p>{ __( 'PageSpeed Insights is preparing data for your home page…', 'google-site-kit' ) }</p>
						</div>
					</div>
				}
				<PageSpeedInsightsDashboardWidgetHomepageSpeedMobile
					handleDataLoaded={ this.handleDataLoaded }
					handleDataError={ this.handleDataError }
				/>
				<PageSpeedInsightsDashboardWidgetHomepageSpeedDesktop />
				{ ! loading &&
					<Fragment>
						<div className="
							mdc-layout-grid__cell
							mdc-layout-grid__cell--span-4-phone
							mdc-layout-grid__cell--span-4-tablet
							mdc-layout-grid__cell--span-6-desktop
						">
							<SourceLink
								name={ source.name }
								href={ source.link }
								external
							/>
						</div>
						<div className="
							mdc-layout-grid__cell
							mdc-layout-grid__cell--span-4-phone
							mdc-layout-grid__cell--span-4-tablet
							mdc-layout-grid__cell--span-6-desktop
							mdc-layout-grid__cell--align-right-tablet
						">
							<PageSpeedReportScale />
						</div>
					</Fragment>
				}
			</Fragment>
		);
	}
}
export default PageSpeedInsightsDashboardWidgetHomepageSpeed;
