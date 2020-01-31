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
 * External dependencies
 */
import SourceLink from 'GoogleComponents/source-link';
import ProgressBar from 'GoogleComponents/progress-bar';
import getDataErrorComponent from 'GoogleComponents/notifications/data-error';

/**
 * WordPress dependencies
 */
import { Component, Fragment } from '@wordpress/element';
import { __, _x, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import {
	PageSpeedInsightsDashboardWidgetHomepageSpeedDesktop,
	PageSpeedInsightsDashboardWidgetHomepageSpeedMobile,
} from './dashboard-widget-homepage-speed-column';
import { PageSpeedReportScale } from './util';

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
			name: _x( 'PageSpeed Insights', 'Service name', 'google-site-kit' ),
			link: sprintf( 'https://developers.google.com/speed/pagespeed/insights/?url=%s', global.googlesitekit.permaLink || global.googlesitekit.admin.siteURL ),
		};

		if ( error ) {
			return (
				<div className="
					mdc-layout-grid__cell
					mdc-layout-grid__cell--span-12
				">
					{
						getDataErrorComponent(
							_x( 'PageSpeed Insights', 'Service name', 'google-site-kit' ),
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
							<p>{ __( 'PageSpeed Insights is preparing data…', 'google-site-kit' ) }</p>
						</div>
					</div>
				}
				<PageSpeedInsightsDashboardWidgetHomepageSpeedMobile
					handleDataLoaded={ this.handleDataLoaded }
					handleDataError={ this.handleDataError }
					title={ __( 'Mobile', 'google-site-kit' ) }
				/>
				<PageSpeedInsightsDashboardWidgetHomepageSpeedDesktop
					title={ __( 'Desktop', 'google-site-kit' ) }
				/>
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
