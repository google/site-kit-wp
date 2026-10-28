/**
 * Repeater stories.
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
import { TextField } from 'googlesitekit-components';
import { Story } from '@/js/types/Story';
import Repeater from './Repeater';

interface StoryArgs {
	initialCount?: number;
	removable?: boolean;
	maxItems?: number;
}

function Template( {
	initialCount = 2,
	removable = false,
	maxItems = Infinity,
}: StoryArgs ) {
	const nextID = useRef( initialCount );
	const [ items, setItems ] = useState( () =>
		Array.from( { length: initialCount }, ( _, index ) => ( {
			id: `answer-${ index }`,
			value: '',
		} ) )
	);

	return (
		<Repeater
			getItemID={ ( item ) => item.id }
			getNewItem={ () => ( {
				id: `answer-${ nextID.current++ }`,
				value: '',
			} ) }
			items={ items }
			maxItems={ maxItems }
			onChange={ setItems }
			renderField={ (
				{ item, updateItem, inputRef, RemoveButton },
				index
			) => (
				<div
					style={ {
						display: 'flex',
						alignItems: 'center',
						gap: 8,
						marginBottom: 16,
					} }
				>
					<TextField
						inputRef={ inputRef }
						label={ `Answer ${ index + 1 }` }
						onChange={ ( event ) =>
							updateItem( {
								...item,
								value: event.target.value,
							} )
						}
						value={ item.value }
						outlined
					/>
					{ removable && (
						<RemoveButton
							aria-label={ `Remove Answer ${ index + 1 }` }
						/>
					) }
				</div>
			) }
		/>
	);
}

export const Default = Template.bind( {} ) as Story< StoryArgs >;
Default.storyName = 'Default';
Default.args = { initialCount: 2 };

export const WithRemoveButton = Template.bind( {} ) as Story< StoryArgs >;
WithRemoveButton.storyName = 'With Remove Button';
WithRemoveButton.args = { ...Default.args, removable: true };

export const WithMaxLength = Template.bind( {} ) as Story< StoryArgs >;
WithMaxLength.storyName = 'With Max Length';
WithMaxLength.args = {
	...WithRemoveButton.args,
	initialCount: 5,
	maxItems: 5,
};

export default {
	title: 'Components/Repeater',
	component: Repeater,
};
