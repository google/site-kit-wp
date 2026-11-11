/**
 * CustomQuestionSideSheet component.
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
import { FC } from 'react';

/**
 * WordPress dependencies
 */
import { useRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import SideSheet from '@/js/components/SideSheet';
import CustomQuestionForm from './CustomQuestionForm';
import { CustomSurveyQuestion } from './types';

export interface CustomQuestionSideSheetProps {
	isOpen: boolean;
	onClose: () => void;
	onSave: ( question: CustomSurveyQuestion ) => void;
	question?: CustomSurveyQuestion;
}

const CustomQuestionSideSheet: FC< CustomQuestionSideSheetProps > = ( {
	isOpen,
	onClose,
	onSave,
	question,
} ) => {
	const inputRef = useRef< HTMLInputElement | HTMLTextAreaElement | null >(
		null
	);

	return (
		<SideSheet
			className="googlesitekit-side-sheet--rrm-custom-question"
			closeSheet={ onClose }
			focusTrapOptions={ {
				initialFocus: () => inputRef.current ?? undefined,
			} }
			isOpen={ isOpen }
		>
			{ isOpen && (
				<CustomQuestionForm
					onClose={ onClose }
					onSave={ onSave }
					question={ question }
					questionInputRef={ inputRef }
				/>
			) }
		</SideSheet>
	);
};

export default CustomQuestionSideSheet;
