/**
 * AdSenseDashboardWidget component.
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
import Header from 'GoogleComponents/header';
import PageHeader from 'GoogleComponents/page-header';
import Layout from 'GoogleComponents/layout/layout';
/**
 * Internal dependencies
 */
import AdSenseEstimateEarningsWidget from './dashboard-widget-estimate-earnings';
import AdSensePerformanceWidget from './dashboard-widget-performance';
import Alert from 'GoogleComponents/alert';
import DashboardAdSenseTopPages from './dashboard-adsense-top-pages';
import getNoDataComponent from 'GoogleComponents/notifications/nodata';
import getDataErrorComponent from 'GoogleComponents/notifications/data-error';
import ProgressBar from 'GoogleComponents/progress-bar';
import AdSenseDashboardOutro from './dashboard-outro';
import { isAdsenseConnectedAnalytics } from '../util';
import ModuleSettingsWarning from 'GoogleComponents/notifications/module-settings-warning';
import AdSenseInProcessStatus from './adsense-in-process-status';
import HelpLink from 'GoogleComponents/help-link';

/**
 * WordPress dependencies
 */
import { Component, Fragment } from '@wordpress/element';
import { __, _x } from '@wordpress/i18n';

class AdSenseDashboardWidget extends Component {
	constructor( props ) {
		super( props );
		this.state = {
			receivingData: true,
			error: false,
			loading: true,
			isAdSenseConnected: true,
			zeroData: false,
		};
		this.handleDataError = this.handleDataError.bind( this );
		this.handleDataSuccess = this.handleDataSuccess.bind( this );
		this.handleZeroData = this.handleZeroData.bind( this );
	}

	componentDidMount() {
		this.isAdSenseConnected();
	}

	async isAdSenseConnected() {
		const adsenseConnect = await isAdsenseConnectedAnalytics();

		if ( adsenseConnect ) {
			this.setState( {
				isAdSenseConnected: true,
			} );
		} else {
			this.setState( {
				isAdSenseConnected: false,
			} );
		}
	}

	/**
	 * Handle data errors from the contained AdSense component(s).
	 *
	 * Currently handled in the AdSenseEstimateEarningsWidget component.
	 *
	 * If this component's API data calls returns an error, the error message is passed to this callback, resulting in the display of an error Notification.
	 *
	 * If the component detects no data - in this case all 0s - the callback is called without an error message,
	 * resulting in the display of a CTA.
	 *
	 * @param {string} error A potential error string.
	 */
	handleDataError( error ) {
		this.setState( {
			receivingData: false,
			error,
			loading: false,
		} );
	}

	/**
	 * Loading is set to false until data starts to resolve.
	 */
	handleDataSuccess() {
		this.setState( {
			receivingData: true,
			loading: false,
		} );
	}

	/**
	 * Show the "We're getting your site ready for ads. screen until we have data.".
	 */
	handleZeroData() {
		this.setState( {
			zeroData: true,
			loading: false,
		} );
	}

	render() {
		const {
			receivingData,
			error,
			loading,
			isAdSenseConnected,
			zeroData,
		} = this.state;
		const { homepage } = googlesitekit.modules.adsense;

		// Hide AdSense data display when we don't have data.
		const wrapperClass = ( loading || ! receivingData || zeroData ) ? 'googlesitekit-nodata' : '';

		return (
			<Fragment>
				<Header />
				<div className={ `${ wrapperClass }` }>
					<Alert module="adsense" />
				</div>

				<div className="googlesitekit-module-page googlesitekit-module-page--adsense">
					<div className="mdc-layout-grid">
						<div className="mdc-layout-grid__inner">
							<div className="
								mdc-layout-grid__cell
								mdc-layout-grid__cell--span-12
							">
								{
									( ! error && googlesitekit.modules.adsense.setupComplete ) ?
										<PageHeader title={ _x( 'AdSense', 'Service name', 'google-site-kit' ) } icon iconWidth="30" iconHeight="26" iconID="adsense" status="connected" statusText={ __( 'AdSense is connected', 'google-site-kit' ) } /> :
										<PageHeader title={ _x( 'AdSense', 'Service name', 'google-site-kit' ) } icon iconWidth="30" iconHeight="26" iconID="adsense" status="not-connected" statusText={ __( 'AdSense is not connected', 'google-site-kit' ) } />
								}
								{ loading && <ProgressBar /> }
							</div>
							{ /* Data issue: on error display a notification. On missing data: display a CTA. */ }
							{ zeroData &&
								<div className="
									mdc-layout-grid__cell
									mdc-layout-grid__cell--span-12
								">
									<Layout fill>
										<div className="mdc-layout-grid mdc-layout-grid--fill">
											<div className="mdc-layout-grid__inner">
												<div className="mdc-layout-grid__cell mdc-layout-grid__cell--span-12">
													<AdSenseInProcessStatus status="incomplete" />
												</div>
											</div>
										</div>
									</Layout>
								</div>
							}
							{ ! receivingData && (
								error ? getDataErrorComponent( _x( 'AdSense', 'Service name', 'google-site-kit' ), error, true, true, true ) : getNoDataComponent( _x( 'AdSense', 'Service name', 'google-site-kit' ), true, true, true )
							) }
							<div className={ `
								mdc-layout-grid__cell
								mdc-layout-grid__cell--span-12
								${ wrapperClass }
							` } >
								<ModuleSettingsWarning slug="adsense" context="module-dashboard" />
								<Layout
									header
									title={ __( 'Estimated earnings', 'google-site-kit' ) }
									headerCtaLabel={ __( 'Advanced Settings', 'google-site-kit' ) }
									headerCtaLink={ homepage }
								>
									<AdSenseEstimateEarningsWidget
										handleDataError={ this.handleDataError }
										handleDataSuccess={ this.handleDataSuccess }
									/>
								</Layout>
							</div>
							<div className={ `
								mdc-layout-grid__cell
								mdc-layout-grid__cell--span-12
								${ wrapperClass }
							` } >
								<Layout
									header
									title={ __( 'Performance over previous 28 days', 'google-site-kit' ) }
									headerCtaLabel={ __( 'Advanced Settings', 'google-site-kit' ) }
									headerCtaLink={ homepage }
								>
									<AdSensePerformanceWidget
										handleDataError={ ( err ) => {
											// If there is no error, it is a zero data condition.
											if ( ! err ) {
												this.handleZeroData();
											}
										} }
									/>
								</Layout>
							</div>
							<div className={ `
								mdc-layout-grid__cell
								mdc-layout-grid__cell--span-12
								${ wrapperClass }
							` } >
								<DashboardAdSenseTopPages />
							</div>
							<div className="
								mdc-layout-grid__cell
								mdc-layout-grid__cell--span-12
								mdc-layout-grid__cell--align-right
							">
								<HelpLink />
							</div>
						</div>
					</div>
				</div>
				{ ! isAdSenseConnected &&
					<AdSenseDashboardOutro />
				}
			</Fragment>
		);
	}
}

export default AdSenseDashboardWidget;
