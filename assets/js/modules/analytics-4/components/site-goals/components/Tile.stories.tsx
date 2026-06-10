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
 * WordPress dependencies
 */
import { WPDataRegistry } from '@wordpress/data/build-types/registry';

/**
 * Internal dependencies
 */
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import { Story } from '@/js/types/Story';
import WithRegistrySetup from '@tests/js/WithRegistrySetup';
import { Tile, TileProps } from './Tile';

function Template( {
	setupRegistry = () => {},
	...props
}: {
	setupRegistry?: ( registry: WPDataRegistry ) => void;
} & TileProps ) {
	return (
		<WithRegistrySetup func={ setupRegistry }>
			<div
				style={ {
					backgroundColor: 'white',
					padding: '20px',
					display: 'inline-block',
					minWidth: '330px',
				} }
			>
				<Tile { ...props } />
			</div>
		</WithRegistrySetup>
	);
}

export const DefaultTile = Template.bind( {} ) as Story< TileProps >;
DefaultTile.storyName = 'Default Tile';
DefaultTile.args = {
	title: 'Form Submissions',
	subtitle: 'Total submissions',
	currentValue: 1234,
	previousValue: 1100,
	format: { style: 'decimal' },
};

export const PrimaryPositiveTile = Template.bind( {} ) as Story< TileProps >;
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

export const PrimaryNegativeTile = Template.bind( {} ) as Story< TileProps >;
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

export const PrimaryNeutralTile = Template.bind( {} ) as Story< TileProps >;
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

export const PercentFormat = Template.bind( {} ) as Story< TileProps >;
PercentFormat.storyName = 'Percent Format';
PercentFormat.args = {
	title: 'Conversion Rate',
	subtitle: 'Of sessions',
	currentValue: 0.042,
	previousValue: 0.038,
	format: { style: 'percent', maximumFractionDigits: 1 },
};

export const WithInfoTooltip = Template.bind( {} ) as Story< TileProps >;
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

export const NegativeChange = Template.bind( {} ) as Story< TileProps >;
NegativeChange.storyName = 'Negative Change';
NegativeChange.args = {
	title: 'Form Submissions',
	subtitle: 'Total submissions',
	currentValue: 980,
	previousValue: 1200,
	format: { style: 'decimal' },
};

export const ZeroDataPreviousRange = Template.bind( {} ) as Story< TileProps >;
ZeroDataPreviousRange.storyName = 'Zero Data (Previous Range)';
ZeroDataPreviousRange.args = {
	title: 'Form Submissions',
	subtitle: 'Total submissions',
	currentValue: 980,
	previousValue: 0,
	format: { style: 'decimal' },
};

export const ZeroDataBothRanges = Template.bind( {} ) as Story< TileProps >;
ZeroDataBothRanges.storyName = 'Zero Data (Both Ranges)';
ZeroDataBothRanges.args = {
	title: 'Form Submissions',
	subtitle: 'Total submissions',
	currentValue: 0,
	previousValue: 0,
	format: { style: 'decimal' },
};

export const CustomDateRange = Template.bind( {} ) as Story< TileProps >;
CustomDateRange.storyName = 'Custom Date Range (90 days)';
CustomDateRange.args = {
	title: 'Form Submissions',
	subtitle: 'Total submissions',
	currentValue: 3600,
	previousValue: 3100,
	format: { style: 'decimal' },
	setupRegistry: ( registry: WPDataRegistry ) => {
		registry.dispatch( CORE_USER ).setDateRange( 'last-90-days' );
	},
};

export default {
	title: 'Modules/Analytics4/Components/Site Goals/Components/Tile',
	component: Tile,
};
