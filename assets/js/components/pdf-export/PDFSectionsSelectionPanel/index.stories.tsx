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
import { PDF_DOWNLOAD_PANEL_OPENED_KEY } from '@/js/components/pdf-export/constants';
import { CORE_PDF } from '@/js/googlesitekit/datastore/pdf/constants';
import { CORE_UI } from '@/js/googlesitekit/datastore/ui/constants';
import { CORE_WIDGETS } from '@/js/googlesitekit/widgets/datastore/constants';
import { CONTEXT_MAIN_DASHBOARD_TRAFFIC } from '@/js/googlesitekit/widgets/default-contexts';
import WithRegistrySetup from '@tests/js/WithRegistrySetup';
import PDFSectionsSelectionPanel from './index';

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- `@wordpress/data` is not typed yet.
type Registry = any;

function NullComponent() {
	return null;
}

function DefaultTemplate() {
	return <PDFSectionsSelectionPanel />;
}

function EmptyTemplate() {
	const { setSelection } = useDispatch( CORE_PDF );

	// The panel seeds all available sections once on mount. Clearing the
	// selection from this Template's `useEffect` runs after that seed (effects
	// fire bottom-up), so the story renders with no sections selected.
	useEffect( () => {
		setSelection( { contextSlugs: [], widgetSlugs: [] } );
	}, [ setSelection ] );

	return <PDFSectionsSelectionPanel />;
}

export const Default = DefaultTemplate.bind( {} );
Default.storyName = 'Default (all selected)';
Default.scenario = {};

export const Empty = EmptyTemplate.bind( {} );
Empty.storyName = 'All deselected (error state)';
Empty.scenario = {};

export default {
	title: 'Components/PDFGeneration/PDFSectionsSelectionPanel',
	component: PDFSectionsSelectionPanel,
	decorators: [
		( Story: ElementType ): ReactNode => {
			function setupRegistry( registry: Registry ) {
				registry
					.dispatch( CORE_UI )
					.setValue( PDF_DOWNLOAD_PANEL_OPENED_KEY, true );

				const widgets = registry.dispatch( CORE_WIDGETS );
				widgets.registerWidgetArea( 'pdfTrafficArea', {
					title: 'Find out how your audience is growing',
					pdfTitle: 'Traffic',
					style: 'boxes',
					priority: 1,
				} );
				widgets.assignWidgetArea(
					'pdfTrafficArea',
					CONTEXT_MAIN_DASHBOARD_TRAFFIC
				);
				widgets.registerWidget( 'pdfAllTraffic', {
					Component: NullComponent,
					priority: 1,
					pdf: {
						Component: NullComponent,
						getData: () => Promise.resolve( { data: null } ),
						label: 'Site traffic over time',
					},
				} );
				widgets.assignWidget( 'pdfAllTraffic', 'pdfTrafficArea' );
				widgets.registerWidget( 'pdfSearchTraffic', {
					Component: NullComponent,
					priority: 2,
					pdf: {
						Component: NullComponent,
						getData: () => Promise.resolve( { data: null } ),
						label: 'Search traffic',
					},
				} );
				widgets.assignWidget( 'pdfSearchTraffic', 'pdfTrafficArea' );
			}

			return (
				<WithRegistrySetup func={ setupRegistry }>
					<Story />
				</WithRegistrySetup>
			);
		},
	],
};
