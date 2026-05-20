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
import WithRegistrySetup from '../../../../../tests/js/WithRegistrySetup';
import { CORE_UI } from '@/js/googlesitekit/datastore/ui/constants';
import { CORE_PDF } from '@/js/googlesitekit/datastore/pdf/constants';
import { PDF_GENERATING_KEY } from '@/js/components/pdf-generation/constants';
import PDFSectionsSelectionPanel from './index';

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- `@wordpress/data` is not typed yet.
type Registry = any;

function DefaultTemplate() {
	return <PDFSectionsSelectionPanel />;
}

function EmptyTemplate() {
	const { setSectionsSelectedItems } = useDispatch( CORE_PDF );

	// The panel's `onSideSheetOpen` resets the selection to defaults on every
	// mount. Re-applying the empty selection from this Template's `useEffect`
	// runs after the panel's reset (effects fire bottom-up), so the story
	// renders with no sections selected.
	useEffect( () => {
		setSectionsSelectedItems( [] );
	}, [ setSectionsSelectedItems ] );

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
				registry.dispatch( CORE_PDF ).openSectionsPanel();
			}

			return (
				<WithRegistrySetup func={ setupRegistry }>
					<Story />
				</WithRegistrySetup>
			);
		},
	],
};
