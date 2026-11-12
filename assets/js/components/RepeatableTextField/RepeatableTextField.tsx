/**
 * RepeatableTextField component.
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
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { Fragment, useCallback } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { TextField } from 'googlesitekit-components';
import DraggableList from '@/js/components/DraggableList/DraggableList';
import Repeater, {
	RepeaterFieldRenderOptions,
	RepeaterListRenderOptions,
	RepeaterProps,
} from '@/js/components/Repeater/Repeater';
import Typography from '@/js/components/Typography';
import { SIZE_MEDIUM, TYPE_BODY } from '@/js/components/Typography/constants';

type RepeatableTextFieldRepeaterProps< Item > = Pick<
	RepeaterProps< Item >,
	'getItemID' | 'getNewItem' | 'items' | 'maxItems' | 'onChange'
>;

interface RepeatableTextFieldOwnProps< Item > {
	addItemLabel: string;
	className?: classnames.Argument;
	getItemLabel: ( index: number ) => string;
	getItemValue: ( item: Item ) => string;
	getMoveItemLabel: ( index: number ) => string;
	getRemoveItemLabel: ( index: number ) => string;
	getUpdatedItem: ( value: string, item: Item ) => Item;
	legend?: string;
	maxItemLength?: number;
}

type RepeatableTextFieldProps< Item > = RepeatableTextFieldOwnProps< Item > &
	RepeatableTextFieldRepeaterProps< Item >;

function RepeatableTextField< Item >( {
	addItemLabel,
	className,
	getItemID,
	getItemLabel,
	getItemValue,
	getMoveItemLabel,
	getNewItem,
	getRemoveItemLabel,
	getUpdatedItem,
	items,
	legend,
	maxItemLength,
	maxItems,
	onChange,
}: RepeatableTextFieldProps< Item > ) {
	const renderRepeaterList = useCallback(
		( { renderField, AddButton }: RepeaterListRenderOptions< Item > ) => {
			return (
				<Fragment>
					<DraggableList
						getItemID={ getItemID }
						items={ items }
						onChange={ onChange }
						renderItem={ ( { item, DragHandle }, index ) => (
							<Fragment>
								<DragHandle
									label={ getMoveItemLabel( index ) }
								/>
								{ renderField( item, index ) }
							</Fragment>
						) }
					/>
					<AddButton>{ addItemLabel }</AddButton>
				</Fragment>
			);
		},
		[ addItemLabel, getItemID, getMoveItemLabel, items, onChange ]
	);

	const renderRepeaterField = useCallback(
		(
			{
				item,
				updateItem,
				inputRef,
				RemoveButton,
			}: RepeaterFieldRenderOptions< Item >,
			index: number
		) => (
			<Fragment>
				<div className="googlesitekit-repeatable-text-field__text-field">
					<TextField
						inputRef={ inputRef }
						label={ getItemLabel( index ) }
						maxLength={ maxItemLength }
						onChange={ ( event ) => {
							updateItem(
								getUpdatedItem( event.target.value, item )
							);
						} }
						value={ getItemValue( item ) }
						outlined
						showCharacterCounter
					/>
				</div>
				<RemoveButton label={ getRemoveItemLabel( index ) } />
			</Fragment>
		),
		[
			getItemLabel,
			getItemValue,
			getRemoveItemLabel,
			getUpdatedItem,
			maxItemLength,
		]
	);

	return (
		<fieldset
			className={ classnames(
				'googlesitekit-repeatable-text-field',
				className
			) }
		>
			{ legend ? (
				<Typography
					as="legend"
					className="googlesitekit-repeatable-text-field__legend"
					size={ SIZE_MEDIUM }
					type={ TYPE_BODY }
				>
					{ legend }
				</Typography>
			) : null }

			<Repeater
				getItemID={ getItemID }
				getNewItem={ getNewItem }
				items={ items }
				maxItems={ maxItems }
				onChange={ onChange }
				renderField={ renderRepeaterField }
				renderList={ renderRepeaterList }
			/>
		</fieldset>
	);
}

export default RepeatableTextField;
