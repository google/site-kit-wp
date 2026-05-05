/**
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
 * Internal dependencies
 */
import { Tile, type TileProps } from './Tile';
import WithRegistrySetup from '../../../../../../../tests/js/WithRegistrySetup';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- `@wordpress/data` is not typed yet.
type Registry = any;

// Type for Storybook story exports with custom properties
type Story = {
	( props: TileProps ): JSX.Element;
	storyName?: string;
	args?: TileProps & { setupRegistry?: ( registry: Registry ) => void };
	scenario?: Record< string, unknown >;
};

function Template( {
	setupRegistry = () => {},
	...props
}: {
	setupRegistry?: ( registry: Registry ) => void;
} & TileProps ) {
	return (
		<WithRegistrySetup func={ setupRegistry }>
			<div
				style={ {
					backgroundColor: 'white',
					padding: '20px',
					display: 'inline-block',
				} }
			>
				<Tile { ...props } />
			</div>
		</WithRegistrySetup>
	);
}

export const DefaultTile = Template.bind( {} ) as Story;
DefaultTile.storyName = 'Default Tile';
DefaultTile.args = {
	title: 'Form Submissions',
	subtitle: 'Total submissions',
	currentValue: 1234,
	previousValue: 1100,
	format: { style: 'decimal' },
};

export const PrimaryPositiveTile = Template.bind( {} ) as Story;
PrimaryPositiveTile.storyName = 'Primary Tile - Positive';
PrimaryPositiveTile.args = {
	title: 'Revenue',
	subtitle: 'Total revenue',
	currentValue: 52000,
	previousValue: 48000,
	format: { style: 'decimal' },
	primary: true,
};
PrimaryPositiveTile.scenario = {};

export const PrimaryNegativeTile = Template.bind( {} ) as Story;
PrimaryNegativeTile.storyName = 'Primary Tile - Negative';
PrimaryNegativeTile.args = {
	title: 'Revenue',
	subtitle: 'Total revenue',
	currentValue: 48000,
	previousValue: 52000,
	format: { style: 'decimal' },
	primary: true,
};
PrimaryNegativeTile.scenario = {};

export const PrimaryNeutralTile = Template.bind( {} ) as Story;
PrimaryNeutralTile.storyName = 'Primary Tile - Neutral';
PrimaryNeutralTile.args = {
	title: 'Revenue',
	subtitle: 'Total revenue',
	currentValue: 50000,
	previousValue: 50000,
	format: { style: 'decimal' },
	primary: true,
};
PrimaryNeutralTile.scenario = {};

export const PercentFormat = Template.bind( {} ) as Story;
PercentFormat.storyName = 'Percent Format';
PercentFormat.args = {
	title: 'Conversion Rate',
	subtitle: 'Of sessions',
	currentValue: 0.042,
	previousValue: 0.038,
	format: { style: 'percent', maximumFractionDigits: 1 },
};

export const WithInfoTooltip = Template.bind( {} ) as Story;
WithInfoTooltip.storyName = 'With Info Tooltip';
WithInfoTooltip.args = {
	title: 'Add to Cart',
	subtitle: 'Total events',
	infoTooltip: 'Number of times users added a product to their cart.',
	currentValue: 874,
	previousValue: 920,
	format: { style: 'decimal' },
};
WithInfoTooltip.scenario = {};

export const NegativeChange = Template.bind( {} ) as Story;
NegativeChange.storyName = 'Negative Change';
NegativeChange.args = {
	title: 'Form Submissions',
	subtitle: 'Total submissions',
	currentValue: 980,
	previousValue: 1200,
	format: { style: 'decimal' },
};

export const ZeroDataPreviousRange = Template.bind( {} ) as Story;
ZeroDataPreviousRange.storyName = 'Zero Data (Previous Range)';
ZeroDataPreviousRange.args = {
	title: 'Form Submissions',
	subtitle: 'Total submissions',
	currentValue: 980,
	previousValue: 0,
	format: { style: 'decimal' },
};

export const CustomDateRange = Template.bind( {} ) as Story;
CustomDateRange.storyName = 'Custom Date Range (90 days)';
CustomDateRange.args = {
	title: 'Form Submissions',
	subtitle: 'Total submissions',
	currentValue: 3600,
	previousValue: 3100,
	format: { style: 'decimal' },
	setupRegistry: ( registry: Registry ) => {
		registry.dispatch( CORE_USER ).setDateRange( 'last-90-days' );
	},
};

export default {
	title: 'Modules/Analytics4/Components/Site Goals/Components/Tile',
	component: Tile,
};
