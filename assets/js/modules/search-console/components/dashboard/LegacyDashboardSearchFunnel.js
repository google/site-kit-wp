/**
 * LegacyDashboardSearchFunnel component.
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
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { Component, Fragment } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { getModulesData } from '../../../../util';
import Layout from '../../../../components/layout/Layout';
import DashboardModuleHeader from '../../../../components/dashboard/DashboardModuleHeader';
import ActivateModuleCTA from '../../../../components/ActivateModuleCTA';
import LegacyDashboardSearchFunnelInner from './LegacyDashboardSearchFunnelInner';

class LegacyDashboardSearchFunnel extends Component {
	render() {
		const modulesData = getModulesData();
		const { canManageOptions } = global._googlesitekitLegacyData.permissions;

		// Users without manage options capability will not see Setup CTA.
		const wrapperCols = ! modulesData.analytics.active && ! canManageOptions ? 6 : 12;

		return (
			<Fragment>
				<div className="
					mdc-layout-grid__cell
					mdc-layout-grid__cell--span-12
				">
					<DashboardModuleHeader
						title={ __( 'Search Funnel', 'google-site-kit' ) }
						description={ __( 'How your site appeared in Search results and how many visitors you got from Search', 'google-site-kit' ) }
					/>
				</div>
				<div className={ classnames(
					'mdc-layout-grid__cell',
					`mdc-layout-grid__cell--span-${ wrapperCols }`
				) }>
					<Layout className="googlesitekit-analytics-search-funnel">
						<div className="mdc-layout-grid">
							<div className="mdc-layout-grid__inner">
								<LegacyDashboardSearchFunnelInner />
								{ // Show the Analytics CTA if analytics is not enabled.
									( ! modulesData.analytics.active ) &&
									<div className="
										mdc-layout-grid__cell
										mdc-layout-grid__cell--span-4-phone
										mdc-layout-grid__cell--span-4-tablet
										mdc-layout-grid__cell--span-6-desktop
									">
										<ActivateModuleCTA moduleSlug="analytics" />
									</div>
								}
							</div>
						</div>
					</Layout>
				</div>
			</Fragment>
		);
	}
}

export default LegacyDashboardSearchFunnel;
