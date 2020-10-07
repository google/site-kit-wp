/**
 * AnalyticsDashboardDetailsWidgetTopAcquisitionSources component.
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
 * WordPress dependencies
 */
import { Fragment } from '@wordpress/element';
import { __, _x } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import DashboardModuleHeader from '../../../../components/dashboard/dashboard-module-header';
import Layout from '../../../../components/layout/layout';
import LegacyAnalyticsDashboardWidgetTopAcquisitionSources from '../dashboard/LegacyAnalyticsDashboardWidgetTopAcquisitionSources';
import LegacyDashboardAcquisitionPieChart from '../dashboard/LegacyDashboardAcquisitionPieChart';
import { STORE_NAME } from '../../datastore/constants';
import { STORE_NAME as CORE_SITE } from '../../../../googlesitekit/datastore/site/constants';

const { useSelect } = Data;

export default function AnalyticsDashboardDetailsWidgetTopAcquisitionSources() {
	const serviceURL = useSelect( ( select ) => {
		const accountID = select( STORE_NAME ).getAccountID();
		const profileID = select( STORE_NAME ).getProfileID();
		const internalWebPropertyID = select( STORE_NAME ).getInternalWebPropertyID();
		const url = select( CORE_SITE ).getCurrentEntityURL();

		let path = `/report/trafficsources-overview/a${ accountID }w${ internalWebPropertyID }p${ profileID }/`;
		if ( url ) {
			const parsedURL = new URL( url );
			path += `_r.drilldown=analytics.pagePath:${ parsedURL.pathname.replace( /\//g, '~2F' ) }`;
		}

		return select( STORE_NAME ).getServiceURL( { path } );
	} );
	return (
		<Fragment>
			<div className="
					mdc-layout-grid__cell
					mdc-layout-grid__cell--span-12
				">
				<DashboardModuleHeader
					title={ __( 'All Traffic', 'google-site-kit' ) }
					description={ __( 'How people found your page.', 'google-site-kit' ) }
				/>
			</div>
			<div className="
					mdc-layout-grid__cell
					mdc-layout-grid__cell--span-12
				">
				<Layout
					className="googlesitekit-analytics-acquisition-sources"
					footer
					footerCtaLabel={ _x( 'Analytics', 'Service name', 'google-site-kit' ) }
					footerCtaLink={ serviceURL }
				>
					<div className="mdc-layout-grid">
						<div className="mdc-layout-grid__inner">
							<div className="
									mdc-layout-grid__cell
									mdc-layout-grid__cell--span-4-desktop
									mdc-layout-grid__cell--span-8-tablet
									mdc-layout-grid__cell--span-4-phone
								">
								<LegacyDashboardAcquisitionPieChart />
							</div>
							<div className="
									mdc-layout-grid__cell
									mdc-layout-grid__cell--span-8-desktop
									mdc-layout-grid__cell--span-8-tablet
									mdc-layout-grid__cell--span-4-phone
								">
								<LegacyAnalyticsDashboardWidgetTopAcquisitionSources />
							</div>
						</div>
					</div>
				</Layout>
			</div>
		</Fragment>
	);
}
