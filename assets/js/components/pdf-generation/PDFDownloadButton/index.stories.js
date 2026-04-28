/**
 * PDFDownloadButton Component Stories.
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
import PDFDownloadButton from '.';

function Template() {
	return <PDFDownloadButton />;
}

export const Default = Template.bind( {} );
Default.storyName = 'Default';
Default.scenario = {};

export const Mobile = Template.bind( {} );
Mobile.storyName = 'Mobile';
Mobile.scenario = {};
Mobile.parameters = {
	viewport: {
		defaultViewport: 'mobile1',
	},
};

export default {
	title: 'Components/PDFGeneration/PDFDownloadButton',
	component: PDFDownloadButton,
	parameters: {
		features: [ 'pdfGeneration' ],
	},
	decorators: [
		( Story ) => {
			return (
				<WithRegistrySetup func={ () => {} }>
					<Story />
				</WithRegistrySetup>
			);
		},
	],
};
