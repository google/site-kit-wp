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
import { TilesGroup, type TilesGroupProps } from './TilesGroup';
import { Tile } from './Tile';
import WithRegistrySetup from '../../../../../../../tests/js/WithRegistrySetup';

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- `@wordpress/data` is not typed yet.
type Registry = any;

function Template( {
	setupRegistry = () => {},
	...props
}: {
	setupRegistry?: ( registry: Registry ) => void;
} & TilesGroupProps ) {
	return (
		<WithRegistrySetup func={ setupRegistry }>
			<div
				style={ {
					backgroundColor: 'white',
					padding: '20px',
				} }
			>
				<TilesGroup { ...props } />
			</div>
		</WithRegistrySetup>
	);
}

export const SingleTile = Template.bind( {} );
SingleTile.storyName = 'Single Tile';
SingleTile.args = {
	title: 'Conversions',
	children: (
		<Tile
			title="Form Submissions"
			subtitle="Total submissions"
			currentValue={ 1234 }
			previousValue={ 1100 }
			format={ { style: 'decimal' } }
			primary
		/>
	),
};

export const MultipleTiles = Template.bind( {} );
MultipleTiles.storyName = 'Multiple Tiles';
MultipleTiles.args = {
	title: 'Conversions',
	children: [
		<Tile
			key="form-submissions"
			title="Form Submissions"
			subtitle="Total submissions"
			currentValue={ 1234 }
			previousValue={ 1100 }
			format={ { style: 'decimal' } }
			primary
		/>,
		<Tile
			key="conversion-rate"
			title="Conversion Rate"
			subtitle="Of sessions"
			currentValue={ 0.042 }
			previousValue={ 0.038 }
			format={ { style: 'percent', maximumFractionDigits: 1 } }
		/>,
		<Tile
			key="add-to-cart"
			title="Add to Cart"
			subtitle="Total events"
			currentValue={ 874 }
			previousValue={ 920 }
			format={ { style: 'decimal' } }
		/>,
	],
};

export const NegativeChanges = Template.bind( {} );
NegativeChanges.storyName = 'Negative Changes';
NegativeChanges.args = {
	title: 'Conversions',
	children: [
		<Tile
			key="form-submissions"
			title="Form Submissions"
			subtitle="Total submissions"
			currentValue={ 980 }
			previousValue={ 1200 }
			format={ { style: 'decimal' } }
			primary
		/>,
		<Tile
			key="conversion-rate"
			title="Conversion Rate"
			subtitle="Of sessions"
			currentValue={ 0.031 }
			previousValue={ 0.042 }
			format={ { style: 'percent', maximumFractionDigits: 1 } }
		/>,
	],
};

export default {
	title: 'Modules/Analytics4/Components/Site Goals/Components/TilesGroup',
	component: TilesGroup,
};
