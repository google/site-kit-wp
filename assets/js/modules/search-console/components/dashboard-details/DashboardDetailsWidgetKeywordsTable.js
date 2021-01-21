/**
 * DashboardDetailsWidgetKeywordsTable component.
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
 * WordPress dependencies
 */
import { Fragment } from '@wordpress/element';
import { __, _x } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import LegacySearchConsoleDashboardWidgetKeywordTable from '../dashboard/LegacySearchConsoleDashboardWidgetKeywordTable';
import DashboardModuleHeader from '../../../../components/dashboard/DashboardModuleHeader';
import Layout from '../../../../components/layout/Layout';
import { MODULES_SEARCH_CONSOLE, DATE_RANGE_OFFSET } from '../../datastore/constants';
import { CORE_SITE } from '../../../../googlesitekit/datastore/site/constants';
import { CORE_USER } from '../../../../googlesitekit/datastore/user/constants';
import { untrailingslashit } from '../../../../util';
import { generateDateRangeArgs } from '../../util/report-date-range-args';

const { useSelect } = Data;

const DashboardDetailsWidgetKeywordsTable = () => {
	const propertyID = useSelect( ( select ) => select( MODULES_SEARCH_CONSOLE ).getPropertyID() );
	const url = useSelect( ( select ) => select( CORE_SITE ).getCurrentEntityURL() );
	const { startDate, endDate } = useSelect( ( select ) => select( CORE_USER ).getDateRangeDates( { offsetDays: DATE_RANGE_OFFSET } ) );
	const footerCTALinkArgs = {
		resource_id: propertyID,
		...generateDateRangeArgs( { startDate, endDate } ),
	};
	const isDomainProperty = useSelect( ( select ) => select( MODULES_SEARCH_CONSOLE ).isDomainProperty() );
	const referenceSiteURL = useSelect( ( select ) => {
		return untrailingslashit( select( CORE_SITE ).getReferenceSiteURL() );
	} );
	if ( url ) {
		footerCTALinkArgs.page = `!${ url }`;
	} else if ( isDomainProperty && referenceSiteURL ) {
		footerCTALinkArgs.page = `*${ referenceSiteURL }`;
	}
	const footerCTALink = useSelect( ( select ) => select( MODULES_SEARCH_CONSOLE ).getServiceURL( {
		path: '/performance/search-analytics',
		query: footerCTALinkArgs,
	} ) );

	return (
		<Fragment>
			<div className="
					mdc-layout-grid__cell
					mdc-layout-grid__cell--span-12
				">
				<DashboardModuleHeader
					title={ __( 'Top Queries', 'google-site-kit' ) }
					description={ __( 'What people searched for to find your page.', 'google-site-kit' ) }
				/>
			</div>
			<div className="
					mdc-layout-grid__cell
					mdc-layout-grid__cell--span-12
				">
				<Layout
					footer
					footerCTALabel={ _x( 'Search Console', 'Service name', 'google-site-kit' ) }
					footerCTALink={ footerCTALink }
				>
					<LegacySearchConsoleDashboardWidgetKeywordTable />
				</Layout>
			</div>
		</Fragment>
	);
};

export default DashboardDetailsWidgetKeywordsTable;
