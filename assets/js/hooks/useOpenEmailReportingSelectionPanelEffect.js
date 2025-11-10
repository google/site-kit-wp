/**
 * Open Email Reporting Selection Panel hook.
 *
 * Site Kit by Google, Copyright 2025 Google LLC
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
import { useMount } from 'react-use';

/**
 * Internal dependencies
 */
import { useDispatch } from 'googlesitekit-data';
import useQueryArg from '@/js/hooks/useQueryArg';
import { CORE_UI } from '@/js/googlesitekit/datastore/ui/constants';
import { USER_SETTINGS_SELECTION_PANEL_OPENED_KEY } from '@/js/components/email-reporting/constants';

export default function useOpenEmailReportingSelectionPanelEffect() {
	const [ emailReportingPanelOpen, setEmailReportingPanelOpen ] = useQueryArg(
		'email-reporting-panel'
	);
	const { setValue: setUIValue } = useDispatch( CORE_UI );

	useMount( () => {
		// If redirected from a pointer CTA or following link from email footer, open the Email Reporting selection panel.
		if ( emailReportingPanelOpen !== undefined ) {
			setUIValue( USER_SETTINGS_SELECTION_PANEL_OPENED_KEY, true );
			setEmailReportingPanelOpen( undefined );
		}
	} );
}
