/**
 * KeyMetricsBackNotice Component Stories.
 *
 * Site Kit by Google, Copyright 2026 Google LLC
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
import { ReactElement } from 'react';

/**
 * WordPress dependencies
 */
import { WPDataRegistry } from '@wordpress/data/build-types/registry';

/**
 * Internal dependencies
 */
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import { withWidgetComponentProps } from '@/js/googlesitekit/widgets/util';
import WithRegistrySetup from '@tests/js/WithRegistrySetup';
import KeyMetricsBackNotice from './KeyMetricsBackNotice';

const WidgetWithComponentProps = withWidgetComponentProps(
	'keyMetricsBackNotice'
)( KeyMetricsBackNotice );

function Template() {
	return (
		<div className="googlesitekit-widget-area--mainDashboardKeyMetricsPrimary">
			<div className="googlesitekit-widget-area-widgets">
				<div className="mdc-layout-grid__inner">
					<div className="mdc-layout-grid__cell mdc-layout-grid__cell--span-12">
						<WidgetWithComponentProps />
					</div>
				</div>
			</div>
		</div>
	);
}

export const Default = Template.bind( {} );
Default.storyName = 'KeyMetricsBackNotice';
Default.scenario = {};

export default {
	title: 'Key Metrics/KeyMetricsBackNotice',
	component: KeyMetricsBackNotice,
	decorators: [
		( Story: () => ReactElement ) => {
			function setupRegistry( registry: WPDataRegistry ) {
				registry.dispatch( CORE_USER ).receiveGetDismissedItems( [] );
			}

			return (
				<WithRegistrySetup func={ setupRegistry }>
					<Story />
				</WithRegistrySetup>
			);
		},
	],
};
