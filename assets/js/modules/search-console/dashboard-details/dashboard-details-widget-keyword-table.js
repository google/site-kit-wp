/**
 * DashboardDetailsWidgetKeywordsTable component.
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

import SearchConsoleDashboardWidgetKeywordTable from '../dashboard/dashboard-widget-keyword-table';
import Layout from 'GoogleComponents/layout/layout';

const { Component } = wp.element;
const { __, sprintf } = wp.i18n;

class DashboardDetailsWidgetKeywordsTable extends Component {

	render() {
		return (
			<div className="
				mdc-layout-grid__cell
				mdc-layout-grid__cell--span-12
			">
				<Layout
					title={ __( 'Top search queries for your site', 'google-site-kit' ) }
					header
					footer
					footerCtaLabel={ __( 'Search Console', 'google-site-kit' ) }
					footerCtaLink={
						sprintf( 'https://search.google.com/u/1/search-console?resource_id=%s', googlesitekit.admin.siteURL )
					}
				>
					<SearchConsoleDashboardWidgetKeywordTable/>
				</Layout>
			</div>
		);
	}
}

export default DashboardDetailsWidgetKeywordsTable;
