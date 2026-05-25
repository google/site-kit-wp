/**
 * PDFSectionsSelectionPanel Component Stories.
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
import type { ElementType, ReactNode } from 'react';

/**
 * WordPress dependencies
 */
import { useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { useDispatch } from 'googlesitekit-data';
import {
	DEFAULT_SELECTED_SECTIONS,
	FORM_PDF_DOWNLOAD,
	FORM_PDF_DOWNLOAD_SELECTED_SECTIONS,
	PDF_DOWNLOAD_PANEL_OPENED_KEY,
	PDF_GENERATING_KEY,
} from '@/js/components/pdf-generation/constants';
import { CORE_FORMS } from '@/js/googlesitekit/datastore/forms/constants';
import { CORE_UI } from '@/js/googlesitekit/datastore/ui/constants';
import useFormValue from '@/js/hooks/useFormValue';
import WithRegistrySetup from '@tests/js/WithRegistrySetup';
import PDFSectionsSelectionPanel from './index';

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- `@wordpress/data` is not typed yet.
type Registry = any;

function DefaultTemplate() {
	return <PDFSectionsSelectionPanel />;
}

function EmptyTemplate() {
	const [ , setSelectedSections ] = useFormValue(
		FORM_PDF_DOWNLOAD,
		FORM_PDF_DOWNLOAD_SELECTED_SECTIONS
	);

	// The panel's `onSideSheetOpen` resets the form to default selection on
	// every mount. Re-applying the empty selection from this Template's
	// `useEffect` runs after the panel's reset (effects fire bottom-up),
	// so the story renders with no sections selected.
	useEffect( () => {
		setSelectedSections( [] );
	}, [ setSelectedSections ] );

	return <PDFSectionsSelectionPanel />;
}

function GeneratingTemplate() {
	const { setValue } = useDispatch( CORE_UI );

	// The panel's `onSideSheetOpen` resets `PDF_GENERATING_KEY` to false on
	// every mount. Setting it back to true from this Template's `useEffect`
	// runs after the panel's reset, so the story renders with the
	// "generating" notice visible.
	useEffect( () => {
		setValue( PDF_GENERATING_KEY, true );
	}, [ setValue ] );

	return <PDFSectionsSelectionPanel />;
}

export const Default = DefaultTemplate.bind( {} );
Default.storyName = 'Default (all selected)';
Default.scenario = {};

export const Empty = EmptyTemplate.bind( {} );
Empty.storyName = 'All deselected (error state)';
Empty.scenario = {};

export const Generating = GeneratingTemplate.bind( {} );
Generating.storyName = 'Generating state';
Generating.scenario = {};

export default {
	title: 'Components/PDFGeneration/PDFSectionsSelectionPanel',
	component: PDFSectionsSelectionPanel,
	decorators: [
		( Story: ElementType ): ReactNode => {
			function setupRegistry( registry: Registry ) {
				registry
					.dispatch( CORE_UI )
					.setValue( PDF_DOWNLOAD_PANEL_OPENED_KEY, true );
				registry.dispatch( CORE_FORMS ).setValues( FORM_PDF_DOWNLOAD, {
					[ FORM_PDF_DOWNLOAD_SELECTED_SECTIONS ]:
						DEFAULT_SELECTED_SECTIONS,
				} );
			}

			return (
				<WithRegistrySetup func={ setupRegistry }>
					<Story />
				</WithRegistrySetup>
			);
		},
	],
};
