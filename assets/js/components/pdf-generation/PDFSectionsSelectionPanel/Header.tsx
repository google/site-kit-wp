/**
 * PDF Sections Selection Panel Header.
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
import { SelectionPanelHeader as UntypedSelectionPanelHeader } from '@/js/components/SelectionPanel';
import UntypedP from '@/js/components/Typography/P';

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- The `SelectionPanelHeader` component is not yet typed.
const SelectionPanelHeader = UntypedSelectionPanelHeader as React.FC< any >;
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- The `P` component is not yet typed.
const P = UntypedP as React.FC< any >;

interface HeaderProps {
	closePanel: () => void;
}

export default function Header( { closePanel }: HeaderProps ) {
	return (
		<SelectionPanelHeader
			title={ __( 'Download your Site Kit report', 'google-site-kit' ) }
			onCloseClick={ closePanel }
		>
			<P>
				{ __(
					'Generate a PDF featuring the current metrics from your dashboard. The report reflects the same date range selected in your dashboard, excluding data from the current day to ensure accuracy.',
					'google-site-kit'
				) }
			</P>
			<P>
				{ __(
					'Select the topics you would like to include in your report:',
					'google-site-kit'
				) }
			</P>
		</SelectionPanelHeader>
	);
}
