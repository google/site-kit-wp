/**
 * Reader Revenue Manager survey questions step types.
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
 * Internal dependencies
 */
import { type IdentifiedSurveyQuestion } from '@/js/modules/reader-revenue-manager/datastore/cta-types';

// Props shared by the question groups in the left column of the step.
export interface QuestionGroupProps {
	// IDs of the expanded questions.
	expandedIDs: string[];
	// Whether the most questions a survey can have are selected.
	isAtLimit: boolean;
	// Message shown on the disabled add actions while at the limit.
	limitMessage: string;
	onAdd: ( entry: IdentifiedSurveyQuestion ) => void;
	onExpand: ( id: string, isExpanded: boolean ) => void;
	onRemove: ( id: string ) => void;
	// Replaces a selected entry with the given one, keeping its position.
	onUpdate: ( entry: IdentifiedSurveyQuestion ) => void;
	selectedQuestions: IdentifiedSurveyQuestion[];
}
