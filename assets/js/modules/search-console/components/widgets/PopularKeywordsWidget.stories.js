/**
 * Site Kit by Google, Copyright 2023 Google LLC
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
import {
	provideKeyMetrics,
	provideModules,
} from '../../../../../../tests/js/utils';
import { withWidgetComponentProps } from '../../../../googlesitekit/widgets/util';
import WithRegistrySetup from '../../../../../../tests/js/WithRegistrySetup';
import PopularKeywordsWidget from './PopularKeywordsWidget';
import { CORE_USER } from '../../../../googlesitekit/datastore/user/constants';
import { MODULES_SEARCH_CONSOLE } from '../../datastore/constants';
import { provideSearchConsoleMockReport } from '../../util/data-mock';
import { Provider as ViewContextProvider } from '../../../../components/Root/ViewContextContext';
import {
	VIEW_CONTEXT_MAIN_DASHBOARD,
	VIEW_CONTEXT_MAIN_DASHBOARD_VIEW_ONLY,
} from '../../../../googlesitekit/constants';

const reportOptions = {
	startDate: '2020-08-11',
	endDate: '2020-09-07',
	dimensions: 'query',
	limit: 100,
};

const WidgetWithComponentProps = withWidgetComponentProps( 'test' )(
	PopularKeywordsWidget
);

const Template = ( { setupRegistry, viewContext, ...args } ) => (
	<WithRegistrySetup func={ setupRegistry }>
		<ViewContextProvider
			value={ viewContext || VIEW_CONTEXT_MAIN_DASHBOARD }
		>
			<WidgetWithComponentProps { ...args } />
		</ViewContextProvider>
	</WithRegistrySetup>
);

export const Ready = Template.bind( {} );
Ready.storyName = 'Ready';
Ready.args = {
	setupRegistry: ( registry ) => {
		provideSearchConsoleMockReport( registry, reportOptions );
	},
};
Ready.scenario = {
	label: 'Key Metrics/PopularKeywordsWidget/Ready',
	delay: 250,
};

export const ReadyViewOnly = Template.bind( {} );
ReadyViewOnly.storyName = 'Ready View Only';
ReadyViewOnly.args = {
	setupRegistry: ( registry ) => {
		provideSearchConsoleMockReport( registry, reportOptions );
	},
	viewContext: VIEW_CONTEXT_MAIN_DASHBOARD_VIEW_ONLY,
};
ReadyViewOnly.scenario = {
	label: 'Key Metrics/PopularKeywordsWidget/ReadyViewOnly',
	delay: 250,
};

export const Loading = Template.bind( {} );
Loading.storyName = 'Loading';
Loading.args = {
	setupRegistry: ( { dispatch } ) => {
		dispatch( MODULES_SEARCH_CONSOLE ).startResolution( 'getReport', [
			reportOptions,
		] );
	},
};

export const ZeroData = Template.bind( {} );
ZeroData.storyName = 'Zero Data';
ZeroData.args = {
	setupRegistry: ( { dispatch } ) => {
		dispatch( MODULES_SEARCH_CONSOLE ).receiveGetReport( [], {
			options: reportOptions,
		} );
	},
};
ZeroData.scenario = {
	label: 'Key Metrics/PopularKeywordsWidget/ZeroData',
	delay: 250,
};

export const Error = Template.bind( {} );
Error.storyName = 'Error';
Error.args = {
	setupRegistry: ( { dispatch } ) => {
		const errorObject = {
			code: 400,
			message: 'Test error message. ',
			data: {
				status: 400,
				reason: 'badRequest',
			},
			selectorData: {
				storeName: 'modules/search-console',
				name: 'getReport',
				args: [ reportOptions ],
			},
		};

		dispatch( MODULES_SEARCH_CONSOLE ).receiveError(
			errorObject,
			'getReport',
			[ reportOptions ]
		);

		dispatch( MODULES_SEARCH_CONSOLE ).finishResolution( 'getReport', [
			reportOptions,
		] );
	},
};
Error.scenario = {
	label: 'KeyMetrics/PopularKeywords/Error',
	delay: 250,
};

export default {
	title: 'Key Metrics/PopularKeywordsWidget',
	decorators: [
		( Story, { args } ) => {
			const setupRegistry = ( registry ) => {
				provideModules( registry, [
					{
						slug: 'search-console',
						active: true,
						connected: true,
					},
				] );

				registry.dispatch( CORE_USER ).setReferenceDate( '2020-09-08' );
				registry
					.dispatch( MODULES_SEARCH_CONSOLE )
					.receiveGetSettings( {
						propertyID: 'http://example.com/',
					} );

				provideKeyMetrics( registry );

				// Call story-specific setup.
				args.setupRegistry( registry );
			};

			return (
				<WithRegistrySetup func={ setupRegistry }>
					<Story />
				</WithRegistrySetup>
			);
		},
	],
};
