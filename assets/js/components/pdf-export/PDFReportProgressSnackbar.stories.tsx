/**
 * PDFReportProgressSnackbar component stories.
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
import type { ReactNode } from 'react';

/**
 * Internal dependencies
 */
import PDFReportProgressSnackbar from './PDFReportProgressSnackbar';

type TemplateProps = {
	progress: number;
	onCancel: () => void;
	title?: string;
	description?: ReactNode;
	cancelLabel?: string;
};

export default {
	title: 'Components/PDFExport/PDFReportProgressSnackbar',
	component: PDFReportProgressSnackbar,
};

function Template( args: TemplateProps ) {
	return <PDFReportProgressSnackbar { ...args } />;
}

export const Initial = Template.bind( {} );
Initial.args = {
	progress: 0.05,
	onCancel: () => {},
};

export const MidProgress = Template.bind( {} );
MidProgress.args = {
	progress: 0.5,
	onCancel: () => {},
};
MidProgress.scenario = {};

export const NearComplete = Template.bind( {} );
NearComplete.args = {
	progress: 0.9,
	onCancel: () => {},
};
