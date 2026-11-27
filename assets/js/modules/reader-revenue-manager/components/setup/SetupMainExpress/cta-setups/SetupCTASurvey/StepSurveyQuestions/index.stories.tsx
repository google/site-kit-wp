/**
 * StepSurveyQuestions Storybook stories.
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

// The survey configuration uses the field names of the `webcontentpublisher` API.
/* eslint-disable sitekit/acronym-case */

/**
 * External dependencies
 */
import fetchMock from 'fetch-mock';
import { ElementType } from 'react';

/**
 * Internal dependencies
 */
import { Registry } from '@/js/googlesitekit-data';
import { CORE_FORMS } from '@/js/googlesitekit/datastore/forms/constants';
import { SURVEY_FORM } from '@/js/modules/reader-revenue-manager/components/setup/SetupMainExpress/cta-setups/SetupCTASurvey/constants';
import {
	createPresetQuestionEntry,
	getDefaultPresetAnswerIDs,
} from '@/js/modules/reader-revenue-manager/components/setup/SetupMainExpress/cta-setups/SetupCTASurvey/utils';
import { MODULE_SLUG_READER_REVENUE_MANAGER } from '@/js/modules/reader-revenue-manager/constants';
import { surveyQuestionCatalog } from '@/js/modules/reader-revenue-manager/datastore/__fixtures__';
import {
	EXPRESS_SETUP_CTA_FORMS,
	MODULES_READER_REVENUE_MANAGER,
} from '@/js/modules/reader-revenue-manager/datastore/constants';
import { type IdentifiedSurveyQuestion } from '@/js/modules/reader-revenue-manager/datastore/cta-types';
import { Story } from '@/js/types/Story';
import {
	freezeFetch,
	provideModuleRegistrations,
	provideModules,
} from '@tests/js/utils';
import WithRegistrySetup from '@tests/js/WithRegistrySetup';
import StepSurveyQuestions from '.';

const PUBLICATION_PARAMS = {
	organizationID: 'ABCD1234',
	publicationID: 'ABCD_123-4',
};

const CATALOG_ENDPOINT = new RegExp(
	'^/google-site-kit/v1/modules/reader-revenue-manager/data/survey-question-catalog'
);

const [ topicsQuestion, ageQuestion, frequencyQuestion ] =
	surveyQuestionCatalog;

const CUSTOM_QUESTION: IdentifiedSurveyQuestion = {
	id: 'custom-question-1',
	question: {
		customQuestion: {
			displayText: 'How did you find us?',
			categoryLabel: 'Acquisition',
			answerChoices: [
				{ displayText: 'Search' },
				{ displayText: 'Social media' },
				{ displayText: 'A friend' },
			],
		},
	},
};

function provideCatalog( registry: Registry ) {
	registry
		.dispatch( MODULES_READER_REVENUE_MANAGER )
		.receiveGetPublicationSurveyQuestionCatalog(
			surveyQuestionCatalog,
			PUBLICATION_PARAMS
		);
}

function provideSelection(
	registry: Registry,
	selectedQuestions: IdentifiedSurveyQuestion[]
) {
	registry.dispatch( CORE_FORMS ).setValues( EXPRESS_SETUP_CTA_FORMS.SURVEY, {
		[ SURVEY_FORM.SELECTED_QUESTIONS ]: selectedQuestions,
		[ SURVEY_FORM.CUSTOM_QUESTIONS ]: [ CUSTOM_QUESTION ],
	} );
}

function Template() {
	return (
		<StepSurveyQuestions onComplete={ () => {} } onGoBack={ () => {} } />
	);
}

export const NoSelection = Template.bind( {} ) as Story;
NoSelection.storyName = 'No Selection';
NoSelection.args = {
	setupRegistry: provideCatalog,
};
NoSelection.scenario = {};

export const SomeSelected = Template.bind( {} ) as Story;
SomeSelected.storyName = 'Some Selected';
SomeSelected.args = {
	setupRegistry: ( registry: Registry ) => {
		provideCatalog( registry );
		provideSelection( registry, [
			CUSTOM_QUESTION,
			createPresetQuestionEntry( ageQuestion ),
		] );
	},
};
SomeSelected.scenario = {};

export const ThreeSelected = Template.bind( {} ) as Story;
ThreeSelected.storyName = 'Three Selected';
ThreeSelected.args = {
	setupRegistry: ( registry: Registry ) => {
		provideCatalog( registry );
		provideSelection( registry, [
			createPresetQuestionEntry(
				topicsQuestion,
				getDefaultPresetAnswerIDs( topicsQuestion )
			),
			CUSTOM_QUESTION,
			createPresetQuestionEntry(
				frequencyQuestion,
				getDefaultPresetAnswerIDs( frequencyQuestion )
			),
		] );
	},
};
ThreeSelected.scenario = {};

export const Loading = Template.bind( {} ) as Story;
Loading.storyName = 'Loading';
Loading.args = {
	setupRegistry: () => {
		freezeFetch( CATALOG_ENDPOINT );
	},
};

export const CatalogError = Template.bind( {} ) as Story;
CatalogError.storyName = 'Catalog Error';
CatalogError.args = {
	setupRegistry: () => {
		fetchMock.get( CATALOG_ENDPOINT, {
			body: {
				code: 'internal_server_error',
				message: 'Internal server error',
				data: { status: 500 },
			},
			status: 500,
		} );
	},
};
CatalogError.scenario = {};

export default {
	title: 'Modules/ReaderRevenueManager/Setup/SetupMainExpress/SetupCTASurvey/StepSurveyQuestions',
	component: StepSurveyQuestions,
	parameters: {
		layout: 'fullscreen',
	},
	decorators: [
		(
			StoryComponent: ElementType,
			{ args }: { args: Story[ 'args' ] }
		) => {
			function setupRegistry( registry: Registry ) {
				const moduleData = [
					{
						slug: MODULE_SLUG_READER_REVENUE_MANAGER,
						active: true,
						connected: true,
					},
				];

				provideModules( registry, moduleData );
				provideModuleRegistrations( registry, moduleData );

				registry
					.dispatch( MODULES_READER_REVENUE_MANAGER )
					.receiveGetSettings( PUBLICATION_PARAMS );

				args?.setupRegistry?.( registry );
			}

			return (
				<WithRegistrySetup func={ setupRegistry }>
					<StoryComponent />
				</WithRegistrySetup>
			);
		},
	],
};
