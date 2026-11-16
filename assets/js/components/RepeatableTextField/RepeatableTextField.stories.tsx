/**
 * RepeatableTextField stories.
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
import { useRef, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { Story } from '@/js/types/Story';
import RepeatableTextField from './RepeatableTextField';

interface StoryArgs {
	legend?: string;
	maxItemLength?: number;
	values: string[];
}

interface StoryItem {
	id: string;
	value: string;
}

function Template( { legend, maxItemLength, values }: StoryArgs ) {
	const nextID = useRef( values.length );

	const [ items, setItems ] = useState< StoryItem[] >( () =>
		values.map( ( value, index ) => ( { id: `answer-${ index }`, value } ) )
	);

	return (
		<RepeatableTextField
			addItemLabel="Add answer"
			getItemID={ ( item ) => item.id }
			getItemLabel={ ( index ) => `Answer ${ index + 1 }` }
			getItemValue={ ( item ) => item.value }
			getMoveItemLabel={ ( index ) => `Move answer ${ index + 1 }` }
			getNewItem={ () => ( {
				id: `answer-${ nextID.current++ }`,
				value: '',
			} ) }
			getRemoveItemLabel={ ( index ) => `Remove answer ${ index + 1 }` }
			getUpdatedItem={ ( value, item ) => ( { ...item, value } ) }
			items={ items }
			legend={ legend }
			maxItemLength={ maxItemLength }
			maxItems={ 5 }
			onChange={ setItems }
		/>
	);
}

export const Default = Template.bind( {} ) as Story< StoryArgs >;
Default.storyName = 'Default';
Default.args = { values: [ '', '', '' ] };

export const WithValues = Template.bind( {} ) as Story< StoryArgs >;
WithValues.storyName = 'With Values';
WithValues.args = { values: [ 'Everyday', 'Once a week', 'Once a month' ] };

export const WithLegend = Template.bind( {} ) as Story< StoryArgs >;
WithLegend.storyName = 'With Legend';
WithLegend.args = {
	legend: 'Add 2-5 answers, you can reorder them if needed',
	values: [ '', '', '' ],
};

export const WithMaximumLength = Template.bind( {} ) as Story< StoryArgs >;
WithMaximumLength.storyName = 'With Maximum Length';
WithMaximumLength.args = {
	maxItemLength: 18,
	values: [ 'Once every few mon', 'Once a month', '' ],
};

export const WithMaximumItems = Template.bind( {} ) as Story< StoryArgs >;
WithMaximumItems.storyName = 'With Maximum Items';
WithMaximumItems.args = {
	values: [
		'Everyday',
		'Once a week',
		'Once a month',
		'Once every few months',
		'Once a year',
	],
};

export const Empty = Template.bind( {} ) as Story< StoryArgs >;
Empty.storyName = 'Empty';
Empty.args = { values: [] };

export default {
	title: 'Components/RepeatableTextField',
	component: RepeatableTextField,
};
