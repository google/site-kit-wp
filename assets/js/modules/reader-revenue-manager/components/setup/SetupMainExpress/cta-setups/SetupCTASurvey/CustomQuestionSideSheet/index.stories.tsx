/**
 * CustomQuestionSideSheet stories.
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
import { Story } from '@/js/types/Story';
import { CustomSurveyQuestion } from './types';
import CustomQuestionSideSheet, { CustomQuestionSideSheetProps } from '.';

function Template( {
	isOpen,
	onClose,
	...args
}: CustomQuestionSideSheetProps ) {
	const [ isSheetOpen, setIsSheetOpen ] = useState( isOpen );

	function closeSheet() {
		setIsSheetOpen( false );
		onClose();
	}

	return (
		<CustomQuestionSideSheet
			{ ...args }
			isOpen={ isSheetOpen }
			onClose={ closeSheet }
		/>
	);
}

export const Default = Template.bind(
	{}
) as Story< CustomQuestionSideSheetProps >;
Default.storyName = 'Default';
Default.scenario = {
	readySelector:
		'.googlesitekit-side-sheet--rrm-custom-question .mdc-text-field--focused',
};

export const WithAnswers = Template.bind(
	{}
) as Story< CustomQuestionSideSheetProps >;
WithAnswers.storyName = 'With Answers';
WithAnswers.args = {
	question: {
		question: 'How many times a week do you eat out?',
		answers: [ 'Everyday', 'Once a week', 'Once a month' ],
	},
};
WithAnswers.scenario = {
	readySelector:
		'.googlesitekit-side-sheet--rrm-custom-question .mdc-text-field--focused',
};

export const WithMaximumAnswers = Template.bind(
	{}
) as Story< CustomQuestionSideSheetProps >;
WithMaximumAnswers.storyName = 'With Maximum Answers';
WithMaximumAnswers.args = {
	question: {
		question: 'How many times a week do you eat out?',
		answers: [
			'Everyday',
			'Once a week',
			'Once a month',
			'Once every few months',
			'Once a year',
		],
		category: 'Dining Out',
	},
};
WithMaximumAnswers.scenario = {
	readySelector:
		'.googlesitekit-side-sheet--rrm-custom-question .mdc-text-field--focused',
};

export const WithError = Template.bind(
	{}
) as Story< CustomQuestionSideSheetProps >;
WithError.storyName = 'With Error';
WithError.args = {
	question: {
		question: 'How many times a week do you eat out?',
		answers: [ 'Everyday' ],
	},
};
WithError.scenario = {
	readySelector:
		'.googlesitekit-side-sheet--rrm-custom-question .mdc-text-field--focused',
};

export default {
	title: 'Modules/ReaderRevenueManager/Setup/SetupMainExpress/SetupCTASurvey/CustomQuestionSideSheet',
	component: CustomQuestionSideSheet,
	args: {
		isOpen: true,
		onClose: () => {},
		// eslint-disable-next-line no-console
		onSave: ( question: CustomSurveyQuestion ) => console.log( question ),
	},
};
