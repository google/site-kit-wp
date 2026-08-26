/**
 * Site Goals KeyActionChartTile stories.
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
 * WordPress dependencies
 */
import { WPDataRegistry } from '@wordpress/data/build-types/registry';

/**
 * Internal dependencies
 */
import { GOAL_TYPES } from '@/js/modules/analytics-4/components/site-goals/goal-drivers/constants';
import { MODULE_SLUG_ANALYTICS_4 } from '@/js/modules/analytics-4/constants';
import { MODULES_ANALYTICS_4 } from '@/js/modules/analytics-4/datastore/constants';
import { provideAnalytics4MockReport } from '@/js/modules/analytics-4/utils/data-mock';
import { Story } from '@/js/types/Story';
import { provideModuleRegistrations, provideModules } from '@tests/js/utils';
import WithRegistrySetup from '@tests/js/WithRegistrySetup';
import getKeyActionChartReportOptions from './getKeyActionChartReportOptions';
import KeyActionChartTile, {
	KeyActionChartTileProps,
} from './KeyActionChartTile';

const dates = { startDate: '2020-08-11', endDate: '2020-09-07' };

const defaultArgs = {
	title: 'Total sales in the last 28 days',
	dates,
	eventNames: [ 'purchase' ],
	goalType: GOAL_TYPES.ECOMMERCE,
};

const reportOptions = getKeyActionChartReportOptions( defaultArgs );

/**
 * Gives the registry a connected Analytics 4 module and registers its widgets.
 *
 * @since n.e.x.t
 *
 * @param {Object} registry The registry to set up.
 * @return {void}
 */
function provideConnectedAnalytics( registry: WPDataRegistry ) {
	provideModules( registry, [
		{
			slug: MODULE_SLUG_ANALYTICS_4,
			active: true,
			connected: true,
		},
	] );
	provideModuleRegistrations( registry );
}

function Template( {
	setupRegistry = () => {},
	pauseAnimation = false,
	...props
}: {
	setupRegistry?: ( registry: WPDataRegistry ) => void;
	pauseAnimation?: boolean;
} & KeyActionChartTileProps ) {
	return (
		<WithRegistrySetup
			func={ ( registry: WPDataRegistry ) => {
				provideConnectedAnalytics( registry );
				setupRegistry( registry );
			} }
		>
			<div
				className={
					pauseAnimation
						? 'googlesitekit-vrt-animation-paused'
						: undefined
				}
				style={ {
					backgroundColor: 'white',
					padding: '20px',
					display: 'inline-block',
					minWidth: '330px',
				} }
			>
				<KeyActionChartTile { ...props } />
			</div>
		</WithRegistrySetup>
	);
}

export const Ready = Template.bind( {} ) as Story< KeyActionChartTileProps >;
Ready.storyName = 'Ready';
Ready.args = {
	...defaultArgs,
	setupRegistry: ( registry: WPDataRegistry ) => {
		provideAnalytics4MockReport( registry, reportOptions );
	},
};
Ready.scenario = {
	// Backstop waits for the chart's SVG before it captures the tile.
	readySelector: '[id^="googlesitekit-chart-"] svg',
	delay: 400,
};

export const Loading = Template.bind( {} ) as Story< KeyActionChartTileProps >;
Loading.storyName = 'Loading';
Loading.args = {
	...defaultArgs,
	// The preview block takes its color from the pulse animation, and a visual
	// regression run turns every animation off, so the block has no color in
	// the captured image. `googlesitekit-vrt-animation-paused` holds the pulse
	// at its first color instead, so the image shows the loading state.
	pauseAnimation: true,
	setupRegistry: ( registry: WPDataRegistry ) => {
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.startResolution( 'getReport', [ reportOptions ] );
	},
};
Loading.scenario = {};

export const ZeroData = Template.bind( {} ) as Story< KeyActionChartTileProps >;
ZeroData.storyName = 'Zero Data';
ZeroData.args = {
	...defaultArgs,
	setupRegistry: ( registry: WPDataRegistry ) => {
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveGetReport( { rows: [] }, { options: reportOptions } );
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.finishResolution( 'getReport', [ reportOptions ] );
	},
};
ZeroData.scenario = {};

export const Error = Template.bind( {} ) as Story< KeyActionChartTileProps >;
Error.storyName = 'Error';
Error.args = {
	...defaultArgs,
	setupRegistry: ( registry: WPDataRegistry ) => {
		registry.dispatch( MODULES_ANALYTICS_4 ).setErrorForSelector(
			{
				code: 400,
				message: 'Test error message. ',
				data: { status: 400, reason: 'badRequest' },
			},
			'getReport',
			[ reportOptions ]
		);
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.finishResolution( 'getReport', [ reportOptions ] );
	},
};
Error.scenario = {};

export default {
	title: 'Modules/Analytics4/Components/Site Goals/Components/KeyActionChartTile',
	component: KeyActionChartTile,
};
