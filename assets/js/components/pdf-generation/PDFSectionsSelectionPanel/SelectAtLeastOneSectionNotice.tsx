/**
 * Select At Least One Section Notice.
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
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import SelectionPanelNotice from '@/js/components/SelectionPanel/SelectionPanelNotice';
import { TYPES } from '@/js/components/Notice/constants';

export default function SelectAtLeastOneSectionNotice() {
	return (
		<SelectionPanelNotice
			// @ts-expect-error - The `SelectionPanelNotice` component is not yet typed.
			className="googlesitekit-notice--side-panel googlesitekit-pdf-download-panel__notice"
			type={ TYPES.ERROR }
			description={ __( 'Select at least 1 topic', 'google-site-kit' ) }
		/>
	);
}
