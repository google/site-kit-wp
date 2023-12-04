/**
 * DashboardNavigation test utility functions.
 *
 * Site Kit by Google, Copyright 2022 Google LLC
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
import { CORE_WIDGETS } from '../../googlesitekit/widgets/datastore/constants';
import {
	CONTEXT_MAIN_DASHBOARD_CONTENT,
	CONTEXT_MAIN_DASHBOARD_SPEED,
	CONTEXT_MAIN_DASHBOARD_TRAFFIC,
} from '../../googlesitekit/widgets/default-contexts';

/**
 * Dispatches required actions to registry to make sure widget contexts for Traffic, Content & Speed are active.
 *
 * @since 1.47.0
 *
 * @param {Object} registry The registry object.
 */
export const setupDefaultChips = ( registry ) => {
	// Traffic
	registry.dispatch( CORE_WIDGETS ).registerWidgetArea( 'TrafficArea', {
		title: 'Traffic',
		subtitle: 'Traffic Widget Area',
		style: 'composite',
	} );
	registry
		.dispatch( CORE_WIDGETS )
		.assignWidgetArea( 'TrafficArea', CONTEXT_MAIN_DASHBOARD_TRAFFIC );
	registry.dispatch( CORE_WIDGETS ).registerWidget( 'TrafficWidget', {
		Component() {
			return <div>Traffic Widget</div>;
		},
	} );
	registry
		.dispatch( CORE_WIDGETS )
		.assignWidget( 'TrafficWidget', 'TrafficArea' );

	// Content
	registry.dispatch( CORE_WIDGETS ).registerWidgetArea( 'ContentArea', {
		title: 'Content',
		subtitle: 'Content Widget Area',
		style: 'composite',
	} );
	registry
		.dispatch( CORE_WIDGETS )
		.assignWidgetArea( 'ContentArea', CONTEXT_MAIN_DASHBOARD_CONTENT );
	registry.dispatch( CORE_WIDGETS ).registerWidget( 'ContentWidget', {
		Component() {
			return <div>Content Widget</div>;
		},
	} );
	registry
		.dispatch( CORE_WIDGETS )
		.assignWidget( 'ContentWidget', 'ContentArea' );

	// Speed
	registry.dispatch( CORE_WIDGETS ).registerWidgetArea( 'SpeedArea', {
		title: 'Speed',
		subtitle: 'Speed Widget Area',
		style: 'composite',
	} );
	registry
		.dispatch( CORE_WIDGETS )
		.assignWidgetArea( 'SpeedArea', CONTEXT_MAIN_DASHBOARD_SPEED );
	registry.dispatch( CORE_WIDGETS ).registerWidget( 'SpeedWidget', {
		Component() {
			return <div>Speed Widget</div>;
		},
	} );
	registry
		.dispatch( CORE_WIDGETS )
		.assignWidget( 'SpeedWidget', 'SpeedArea' );
};
