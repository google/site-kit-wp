/**
 * SwitchedToGA4Banner Component Stories.
 *
 * Site Kit by Google, Copyright 2023 Google LLC
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
import fetchMock from 'fetch-mock';

/**
 * WordPress dependencies
 */
import { Fragment } from '@wordpress/element';

/**
 * Internal dependencies
 */
import SwitchedToGA4Banner from './SwitchedToGA4Banner';
import WithRegistrySetup from '../../../../tests/js/WithRegistrySetup';
import { provideModules } from '../../../../tests/js/utils';
import {
	DASHBOARD_VIEW_UA,
	MODULES_ANALYTICS,
} from '../../modules/analytics/datastore/constants';
import { CORE_USER } from '../../googlesitekit/datastore/user/constants';
import FeatureTours from '../FeatureTours';

function Template() {
	return <SwitchedToGA4Banner />;
}

export const Default = Template.bind( {} );
Default.storyName = 'Default';
Default.parameters = {
	features: [ 'ga4Reporting' ],
};
Default.scenario = {
	label: 'Global/SwitchedToGA4Banner/Default',
};

export default {
	title: 'Components/SwitchedToGA4Banner',
	decorators: [
		( Story ) => {
			const setupRegistry = ( registry ) => {
				provideModules( registry, [
					{
						active: true,
						connected: true,
						slug: 'analytics',
					},
					{
						active: true,
						connected: true,
						slug: 'analytics-4',
					},
				] );

				registry
					.dispatch( MODULES_ANALYTICS )
					.setDashboardView( DASHBOARD_VIEW_UA );

				fetchMock.post(
					new RegExp(
						'^/google-site-kit/v1/core/user/data/dismiss-tour'
					),
					{
						body: JSON.stringify( [ 'ga4Reporting' ] ),
						status: 200,
					}
				);

				registry.dispatch( CORE_USER ).receiveGetDismissedTours( [] );
			};

			return (
				<Fragment>
					{ /* Provide a mockup of the page structure to allow the feature tour to be displayed. */ }
					<div className="googlesitekit-data-block--conversions">
						<div className="googlesitekit-data-block__title"></div>
					</div>
					<div className="googlesitekit-table__head-item--sessions"></div>
					<div className="googlesitekit-table__head-item--engagement-rate"></div>
					<WithRegistrySetup func={ setupRegistry }>
						<Story />
						<FeatureTours />
					</WithRegistrySetup>
				</Fragment>
			);
		},
	],
};
