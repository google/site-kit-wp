/**
 * AnalyticsDashboardDetailsWidgetTopAcquisitionSources component.
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
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import DashboardModuleHeader from '../../../../components/dashboard/DashboardModuleHeader';
import Layout from '../../../../components/layout/Layout';
import { Cell } from '../../../../material-components';
import { getWidgetComponentProps } from '../../../../googlesitekit/widgets/util';
import DashboardAllTrafficWidget from '../dashboard/DashboardAllTrafficWidget';

export default function AnalyticsDashboardDetailsWidgetTopAcquisitionSources() {
	const widgetComponentProps = getWidgetComponentProps( 'legacy-all-traffic-widget' );

	return (
		<Fragment>
			<Cell size={ 12 }>
				<DashboardModuleHeader
					title={ __( 'Your Traffic at a Glance', 'google-site-kit' ) }
					description={ __( 'How people found your page', 'google-site-kit' ) }
				/>
			</Cell>
			<Cell size={ 12 }>
				<Layout>
					<DashboardAllTrafficWidget { ...widgetComponentProps } />
				</Layout>
			</Cell>
		</Fragment>
	);
}
