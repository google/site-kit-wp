/**
 * DashboardDetailsApp component.
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
import DashboardDetailsModules from './dashboard-details-modules';
/**
 * External dependencies
 */
import Header from 'GoogleComponents/header';
import Link from 'GoogleComponents/link';
import PageHeader from 'GoogleComponents/page-header';
import Layout from 'GoogleComponents/layout/layout';
import { decodeHtmlEntity } from 'GoogleUtil';
import DateRangeSelector from 'GoogleComponents/date-range-selector';
import HelpLink from 'GoogleComponents/help-link';

/**
 * WordPress dependencies
 */
import { Component, Fragment } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

class DashboardDetailsApp extends Component {
	constructor( props ) {
		super( props );

		this.state = {};
	}

	render() {
		return (
			<Fragment>
				<Header />
				<div className="googlesitekit-module-page">
					<div className="googlesitekit-dashboard-single-url">
						<div className="mdc-layout-grid">
							<div className="mdc-layout-grid__inner">
								<div className="
									mdc-layout-grid__cell
									mdc-layout-grid__cell--span-2-phone
									mdc-layout-grid__cell--span-4-tablet
									mdc-layout-grid__cell--span-8-desktop
								">
									<Link href={ global.googlesitekit.dashboardPermalink } inherit back small>
										{ __( 'Back to the Site Kit Dashboard', 'google-site-kit' ) }
									</Link>
									<PageHeader
										title={ __( 'Detailed Page Stats', 'google-site-kit' ) }
										className="
											googlesitekit-heading-2
											googlesitekit-dashboard-single-url__heading
										"
										fullWidth
									/>
								</div>
								<div className="
									mdc-layout-grid__cell
									mdc-layout-grid__cell--span-2-phone
									mdc-layout-grid__cell--span-4-tablet
									mdc-layout-grid__cell--span-4-desktop
									mdc-layout-grid__cell--align-right
									mdc-layout-grid__cell--align-bottom
								">
									<DateRangeSelector />
								</div>
								<div className="
									mdc-layout-grid__cell
									mdc-layout-grid__cell--span-12
								">
									<Layout>
										<div className="mdc-layout-grid">
											<div className="mdc-layout-grid__inner">
												<div className="
													mdc-layout-grid__cell
													mdc-layout-grid__cell--span-12
												">
													<h3 className="
															googlesitekit-heading-3
															googlesitekit-dashboard-single-url__title
														">
														{ decodeHtmlEntity( global.googlesitekit.pageTitle ) }
													</h3>
													<Link href={ global.googlesitekit.permaLink } inherit external>
														{ global.googlesitekit.permaLink }
													</Link>
												</div>
											</div>
										</div>
									</Layout>
								</div>
								<DashboardDetailsModules />
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
				</div>
			</Fragment>
		);
	}
}

export default DashboardDetailsApp;
