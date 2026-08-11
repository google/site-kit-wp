/**
 * PDFExportSurveyTriggers component.
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
import { useEffect, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { Select, useSelect } from 'googlesitekit-data';
import SurveyViewTrigger from '@/js/components/surveys/SurveyViewTrigger';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import { DAY_IN_SECONDS } from '@/js/util';
import {
	PDF_EXPORT_DOWNLOADED_ITEM_SLUG,
	PDF_EXPORT_DOWNLOADED_SURVEY_TRIGGER_ID,
	PDF_EXPORT_INCOMPLETE_SURVEY_TRIGGER_ID,
	PDF_EXPORT_NOT_USED_SURVEY_TRIGGER_ID,
	PDF_EXPORT_PANEL_OPENED_ITEM_SLUG,
} from './constants';

// The component reads the `pdf-export-panel-opened` and
// `pdf-export-downloaded` slugs from WordPress user meta, and sends one of
// three survey triggers a day.
const PDFExportSurveyTriggers: FC = () => {
	const hasAlreadyOpenedPDFExportPanel = useSelect(
		( select: Select ) =>
			select( CORE_USER ).isItemDismissed(
				PDF_EXPORT_PANEL_OPENED_ITEM_SLUG
			),
		[]
	);
	const hasAlreadyDownloadedPDFReport = useSelect(
		( select: Select ) =>
			select( CORE_USER ).isItemDismissed(
				PDF_EXPORT_DOWNLOADED_ITEM_SLUG
			),
		[]
	);

	const [ surveyTriggerID, setSurveyTriggerID ] = useState< string | null >(
		null
	);

	useEffect( () => {
		// This effect picks one of three PDF export surveys for the user.
		// Return early when the effect already picked a survey.
		if ( surveyTriggerID !== null ) {
			return;
		}

		if (
			hasAlreadyOpenedPDFExportPanel === undefined ||
			hasAlreadyDownloadedPDFReport === undefined
		) {
			return;
		}

		if ( hasAlreadyDownloadedPDFReport ) {
			// A user who downloaded a report also opened the panel, because
			// the download button sits inside the panel. The download came
			// later, and the later action decides the survey.
			setSurveyTriggerID( PDF_EXPORT_DOWNLOADED_SURVEY_TRIGGER_ID );
		} else if ( hasAlreadyOpenedPDFExportPanel ) {
			setSurveyTriggerID( PDF_EXPORT_INCOMPLETE_SURVEY_TRIGGER_ID );
		} else {
			setSurveyTriggerID( PDF_EXPORT_NOT_USED_SURVEY_TRIGGER_ID );
		}
	}, [
		surveyTriggerID,
		hasAlreadyOpenedPDFExportPanel,
		hasAlreadyDownloadedPDFReport,
	] );

	if ( surveyTriggerID === null ) {
		return null;
	}

	return (
		<SurveyViewTrigger
			triggerID={ surveyTriggerID }
			ttl={ DAY_IN_SECONDS }
		/>
	);
};

export default PDFExportSurveyTriggers;
