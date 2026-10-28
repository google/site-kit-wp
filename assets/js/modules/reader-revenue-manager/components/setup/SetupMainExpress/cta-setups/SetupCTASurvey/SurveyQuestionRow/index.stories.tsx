/**
 * SurveyQuestionRow stories.
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
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import DragHandle from '@/js/components/DraggableList/DragHandle';
import { Story } from '@/js/types/Story';
import SurveyQuestionRow, { SurveyQuestionRowProps } from '.';

function Template( args: SurveyQuestionRowProps ) {
	const [ isAdded, setIsAdded ] = useState( args.isAdded );
	const [ value, setValue ] = useState( args.value );
	const [ isExpanded, setIsExpanded ] = useState( args.isExpanded );

	return (
		<div className="js" style={ { maxWidth: 460 } }>
			<SurveyQuestionRow
				{ ...args }
				isAdded={ isAdded }
				isExpanded={ isExpanded }
				onAdd={ args.onAdd ? () => setIsAdded( true ) : undefined }
				onChange={ args.onChange ? setValue : undefined }
				onExpand={ args.onExpand ? setIsExpanded : undefined }
				onRemove={
					args.onAdd ? () => setIsAdded( false ) : args.onRemove
				}
				value={ value }
			/>
		</div>
	);
}

export const PredefinedQuestion = Template.bind(
	{}
) as Story< SurveyQuestionRowProps >;
PredefinedQuestion.args = {
	answers: [
		{ id: 'high-school-graduate', label: 'High school graduate' },
		{ id: 'associates-degree', label: "Associate's degree" },
		{ id: 'bachelors-degree', label: "Bachelor's degree" },
		{ id: 'graduate-degree', label: 'Graduate degree and above' },
		{ id: 'other', label: 'Other' },
	],
	isExpanded: true,
	note: 'Predefined demographic question answers can’t be edited to help maintain consistency for audience segmentation.',
	onAdd: () => {},
	onExpand: () => {},
	onRemove: () => {},
	question: 'What is your highest education level?',
};

export const DisabledQuestion = Template.bind(
	{}
) as Story< SurveyQuestionRowProps >;
DisabledQuestion.args = {
	...PredefinedQuestion.args,
	disabled: true,
	disabledMessage:
		'You’ve reached the maximum of 3 questions per survey. To add a question, remove a question first.',
};

export const EditableQuestion = Template.bind(
	{}
) as Story< SurveyQuestionRowProps >;
EditableQuestion.storyName = 'Editable Question';
EditableQuestion.args = {
	answers: [
		{ id: 'beauty', label: 'Beauty' },
		{ id: 'clothing', label: 'Clothing' },
		{ id: 'electronics', label: 'Electronics' },
		{ id: 'home-and-garden-products', label: 'Home and garden products' },
		{ id: 'household-appliances', label: 'Household appliances' },
		{ id: 'new-pre-owned-vehicles', label: 'New/Pre-owned vehicles' },
		{ id: 'none', label: 'None of the above' },
		{ id: 'credit-cards', label: 'Credit cards' },
	],
	isExpanded: true,
	note: 'Predefined questions can’t be edited. Choose 2 to 5 answers to show your readers.',
	onAdd: () => {},
	onChange: () => {},
	onRemove: () => {},
	onExpand: () => {},
	question:
		'Are you planning on buying products from the following categories in the next 6 months? Select your top one.',
	value: [
		'beauty',
		'clothing',
		'electronics',
		'home-and-garden-products',
		'household-appliances',
	],
};

export const CustomQuestion = Template.bind(
	{}
) as Story< SurveyQuestionRowProps >;
CustomQuestion.args = {
	answers: [
		{ id: 'very-likely', label: 'Very likely' },
		{ id: 'likely', label: 'Likely' },
		{ id: 'neither', label: 'Neither likely nor unlikely' },
		{ id: 'unlikely', label: 'Unlikely' },
		{ id: 'very-unlikely', label: 'Very unlikely' },
	],
	isAdded: true,
	isExpanded: true,
	onEdit: () => {},
	onExpand: () => {},
	onRemove: () => {},
	question: 'How likely are you to recommend us to a friend?',
};

export const SelectedQuestion = Template.bind(
	{}
) as Story< SurveyQuestionRowProps >;
SelectedQuestion.args = {
	isAdded: true,
	leadingElement: <DragHandle label="Move" />,
	onRemove: () => {},
	question: 'Would you like to share the number of adults in your household?',
};

export const SelectedQuestionHighlighted = Template.bind(
	{}
) as Story< SurveyQuestionRowProps >;
SelectedQuestionHighlighted.storyName = 'Selected Question, Highlighted';
SelectedQuestionHighlighted.args = {
	...SelectedQuestion.args,
	isExpanded: true,
};

export default {
	title: 'Modules/ReaderRevenueManager/Setup/SetupMainExpress/SetupCTASurvey/SurveyQuestionRow',
	component: SurveyQuestionRow,
};
