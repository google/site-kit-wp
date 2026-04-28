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
 * Internal dependencies
 */
import WithRegistrySetup from '../../../../../tests/js/WithRegistrySetup';
import { CORE_UI } from '@/js/googlesitekit/datastore/ui/constants';
import { CORE_FORMS } from '@/js/googlesitekit/datastore/forms/constants';
import {
	FORM_PDF_DOWNLOAD,
	FORM_PDF_DOWNLOAD_SELECTED_SECTIONS,
	PDF_DOWNLOAD_PANEL_OPENED_KEY,
	PDF_GENERATING_KEY,
	DEFAULT_SELECTED_SECTIONS,
} from '@/js/components/pdf-generation/constants';
import PDFSectionsSelectionPanel from '.';

function Template() {
	return <PDFSectionsSelectionPanel />;
}

export const Default = Template.bind( {} );
Default.storyName = 'Default (all selected)';
Default.scenario = {};

export const Empty = Template.bind( {} );
Empty.storyName = 'All deselected (error state)';
Empty.scenario = {};
Empty.args = {
	setupRegistry: ( registry ) => {
		registry.dispatch( CORE_FORMS ).setValues( FORM_PDF_DOWNLOAD, {
			[ FORM_PDF_DOWNLOAD_SELECTED_SECTIONS ]: [],
		} );
	},
};

export const Generating = Template.bind( {} );
Generating.storyName = 'Generating state';
Generating.scenario = {};
Generating.args = {
	setupRegistry: ( registry ) => {
		registry.dispatch( CORE_UI ).setValue( PDF_GENERATING_KEY, true );
	},
};

export const Mobile = Template.bind( {} );
Mobile.storyName = 'Mobile';
Mobile.scenario = {};
Mobile.parameters = {
	viewport: {
		defaultViewport: 'mobile1',
	},
};

export default {
	title: 'Components/PDFGeneration/PDFSectionsSelectionPanel',
	component: PDFSectionsSelectionPanel,
	parameters: {
		features: [ 'pdfGeneration' ],
	},
	decorators: [
		( Story, { args } ) => {
			function setupRegistry( registry ) {
				registry
					.dispatch( CORE_UI )
					.setValue( PDF_DOWNLOAD_PANEL_OPENED_KEY, true );
				registry.dispatch( CORE_FORMS ).setValues( FORM_PDF_DOWNLOAD, {
					[ FORM_PDF_DOWNLOAD_SELECTED_SECTIONS ]:
						DEFAULT_SELECTED_SECTIONS,
				} );

				if ( args?.setupRegistry ) {
					args.setupRegistry( registry );
				}
			}

			return (
				<WithRegistrySetup func={ setupRegistry }>
					<Story />
				</WithRegistrySetup>
			);
		},
	],
};
