/**
 * PDF export survey triggers: fires one survey for each PDF export that finishes.
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
import { usePrevious } from '@wordpress/compose';
import { useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { Select, useDispatch, useSelect } from 'googlesitekit-data';
import { CORE_PDF } from '@/js/googlesitekit/datastore/pdf/constants';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import {
	PDF_EXPORT_ERROR_SURVEY_TRIGGER_ID,
	PDF_EXPORT_SUCCESS_SURVEY_TRIGGER_ID,
} from './constants';

const PDFExportSurveyTriggers: FC = () => {
	const status = useSelect(
		( select: Select ) => select( CORE_PDF ).getStatus(),
		[]
	);
	const previousStatus = usePrevious( status );

	const { triggerSurvey } = useDispatch( CORE_USER );

	useEffect( () => {
		// Each survey asks about one finished PDF export, so it fires on the move
		// into `'error'` or `'success'`, and not again while that status holds.
		// When the user cancels an export, the status returns to `'idle'`, which
		// fires no survey.
		if ( status === previousStatus ) {
			return;
		}

		if ( status === 'error' ) {
			triggerSurvey( PDF_EXPORT_ERROR_SURVEY_TRIGGER_ID );
		}

		if ( status === 'success' ) {
			triggerSurvey( PDF_EXPORT_SUCCESS_SURVEY_TRIGGER_ID );
		}
	}, [ status, previousStatus, triggerSurvey ] );

	return null;
};

export default PDFExportSurveyTriggers;
