/**
 * Selection Panel Component Stories.
 *
 * Site Kit by Google, Copyright 2024 Google LLC
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
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import SelectionPanel from './SelectionPanel';
import SelectionPanelFooter from './SelectionPanelFooter';
import SelectionPanelHeader from './SelectionPanelHeader';
import SelectionPanelItem from './SelectionPanelItem';
import SelectionPanelItems from './SelectionPanelItems';

function Template( { availableSavedItems = {}, savedItemSlugs = [] } ) {
	const [ selectedItems, setSeletectedItems ] = useState(
		Object.keys( availableSavedItems )
	);

	const availableUnsavedItems =
		// Create an array of numbers from 1 to 24.
		Array.from( { length: 24 }, ( _, index ) => index + 1 )
			// Filter out saved items.
			.filter(
				( number ) =>
					! Object.keys( availableSavedItems ).includes(
						`item-${ number }`
					)
			)
			// Map the numbers to an object with the required properties.
			.reduce( ( acc, current ) => {
				const slug = `item-${ current }`;

				return {
					...acc,
					[ slug ]: {
						slug,
						title: `Item ${ current }`,
						description: `Description for item ${ current }`,
					},
				};
			}, {} );

	function ItemComponent( { slug, ...props } ) {
		return (
			<SelectionPanelItem
				id={ slug }
				slug={ slug }
				isItemSelected={ selectedItems.includes( slug ) }
				onCheckboxChange={ ( event ) => {
					setSeletectedItems(
						event?.target?.checked
							? [ ...selectedItems, slug ]
							: selectedItems.filter( ( item ) => item !== slug )
					);
				} }
				{ ...props }
			/>
		);
	}

	return (
		<SelectionPanel isOpen>
			<SelectionPanelHeader title="Select items">
				<p>Select items from the selection below</p>
			</SelectionPanelHeader>
			<SelectionPanelItems
				availableSavedItems={ availableSavedItems }
				availableUnsavedItems={ availableUnsavedItems }
				ItemComponent={ ItemComponent }
				savedItemSlugs={ savedItemSlugs }
			/>
			<SelectionPanelFooter
				maxSelectedItemCount={ 24 }
				selectedItemSlugs={ selectedItems }
			/>
		</SelectionPanel>
	);
}

export const Default = Template.bind( {} );
Default.storyName = 'Default';
Default.scenario = {
	label: 'Components/SelectionPanel/Default',
};

export const WithSavedItems = Template.bind( {} );
WithSavedItems.storyName = 'With saved items';
WithSavedItems.args = {
	availableSavedItems: {
		'item-1': {
			id: 'item-1',
			title: 'Item 1',
			description: 'Description for item 1',
		},
		'item-2': {
			id: 'item-2',
			title: 'Item 2',
			description: 'Description for item 2',
		},
		'item-3': {
			id: 'item-3',
			title: 'Item 3',
			description: 'Description for item 3',
		},
	},
	savedItemSlugs: [ 'item-1', 'item-2', 'item-3' ],
};
WithSavedItems.scenario = {
	label: 'Components/SelectionPanel/WithSavedItems',
};

export const withZeroUnsavedItems = Template.bind( {} );
withZeroUnsavedItems.storyName = 'With zero unsaved items';
withZeroUnsavedItems.args = {
	availableSavedItems: Array.from(
		{ length: 24 },
		( _, index ) => index + 1
	).reduce( ( acc, current ) => {
		const slug = `item-${ current }`;

		return {
			...acc,
			[ slug ]: {
				slug,
				title: `Item ${ current }`,
				description: `Description for item ${ current }`,
			},
		};
	}, {} ),
	savedItemSlugs: Array.from(
		{ length: 24 },
		( _, index ) => `item-${ index + 1 }`
	),
};

export default {
	title: 'Components/Selection Panel',
	component: SelectionPanel,
};
