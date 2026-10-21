/**
 * DashboardMainApp component tests.
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
import fetchMock from 'fetch-mock';

/**
 * Internal dependencies
 */
import { VIEW_CONTEXT_MAIN_DASHBOARD } from '@/js/googlesitekit/constants';
import { mockCreateComponent } from '@tests/js/mock-component-utils';
import {
	createTestRegistry,
	provideModules,
	provideSiteInfo,
	provideUserAuthentication,
	provideUserCapabilities,
	render,
} from '@tests/js/test-utils';
import DashboardMainApp from './DashboardMainApp';

jest.mock( './CoreDashboardEffects', () =>
	mockCreateComponent( 'CoreDashboardEffects' )
);
jest.mock( './ModuleDashboardEffects', () =>
	mockCreateComponent( 'ModuleDashboardEffects' )
);
jest.mock( './AdminScreenTooltip', () => ( {
	AdminScreenTooltip: mockCreateComponent( 'AdminScreenTooltip' ),
} ) );
jest.mock( './Header', () => mockCreateComponent( 'Header' ) );
jest.mock( './EntitySearchInput', () =>
	mockCreateComponent( 'EntitySearchInput' )
);
jest.mock( './DateRangePicker', () =>
	mockCreateComponent( 'DateRangePicker' )
);
jest.mock( './DateRangeSelector', () =>
	mockCreateComponent( 'DateRangeSelector' )
);
jest.mock( './help/HelpMenu', () => mockCreateComponent( 'HelpMenu' ) );
jest.mock( './FeaturesMenu', () => mockCreateComponent( 'FeaturesMenu' ) );
jest.mock( './feature-discovery/AddFeaturesButton', () =>
	mockCreateComponent( 'AddFeaturesButton' )
);
jest.mock( './dashboard-sharing/DashboardSharingSettingsButton', () =>
	mockCreateComponent( 'DashboardSharingSettingsButton' )
);
jest.mock( './email-reporting/ManageEmailReportsButton', () =>
	mockCreateComponent( 'ManageEmailReportsButton' )
);
jest.mock( './email-reporting/PUESurveyTriggers', () =>
	mockCreateComponent( 'PUESurveyTriggers' )
);
jest.mock( './email-reporting/UserSettingsSelectionPanel', () =>
	mockCreateComponent( 'UserSettingsSelectionPanel' )
);
jest.mock( './KeyMetrics/MetricsSelectionPanel', () =>
	mockCreateComponent( 'MetricsSelectionPanel' )
);
jest.mock( './notifications/Notifications', () =>
	mockCreateComponent( 'Notifications' )
);
jest.mock( './notifications/OfflineNotification', () =>
	mockCreateComponent( 'OfflineNotification' )
);
jest.mock( './notifications/SetupCTAOverlays', () =>
	mockCreateComponent( 'SetupCTAOverlays' )
);
jest.mock( './pdf-export/PDFDownloadButton', () =>
	mockCreateComponent( 'PDFDownloadButton' )
);
jest.mock( './pdf-export/PDFExportRoot', () =>
	mockCreateComponent( 'PDFExportRoot' )
);
jest.mock( './pdf-export/PDFSectionsSelectionPanel', () =>
	mockCreateComponent( 'PDFSectionsSelectionPanel' )
);
jest.mock( './surveys/CurrentSurveyPortal', () =>
	mockCreateComponent( 'CurrentSurveyPortal' )
);
jest.mock( './surveys/SurveyViewTrigger', () =>
	mockCreateComponent( 'SurveyViewTrigger' )
);
jest.mock( '@/js/googlesitekit/widgets/components/WidgetContextRenderer', () =>
	mockCreateComponent( 'WidgetContextRenderer' )
);
jest.mock(
	'@/js/modules/analytics-4/components/site-goals/selection-panel',
	() => mockCreateComponent( 'SiteGoalsSelectionPanel' )
);
jest.mock(
	'@/js/modules/analytics-4/components/site-goals/SiteGoalsSurveyTriggers',
	() => mockCreateComponent( 'SiteGoalsSurveyTriggers' )
);

describe( 'DashboardMainApp', () => {
	let registry: ReturnType< typeof createTestRegistry >;

	beforeEach( () => {
		registry = createTestRegistry();
		provideUserAuthentication( registry );
		provideSiteInfo( registry );
		provideModules( registry );
		provideUserCapabilities( registry );
		fetchMock.get(
			new RegExp(
				'^/google-site-kit/v1/core/user/data/(audience-settings|dismissed-items)'
			),
			{ body: {}, status: 200 }
		);
	} );

	it( 'should render the date range picker instead of the dropdown when the datePicker feature is enabled', () => {
		const { getByText, queryByText } = render( <DashboardMainApp />, {
			registry,
			features: [ 'datePicker' ],
			viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
		} );

		expect( getByText( /^DateRangePicker/ ) ).toBeInTheDocument();
		expect( queryByText( /^DateRangeSelector/ ) ).not.toBeInTheDocument();
	} );

	it( 'should render the date range dropdown when the datePicker feature is disabled', () => {
		const { getByText, queryByText } = render( <DashboardMainApp />, {
			registry,
			viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
		} );

		expect( getByText( /^DateRangeSelector/ ) ).toBeInTheDocument();
		expect( queryByText( /^DateRangePicker/ ) ).not.toBeInTheDocument();
	} );
} );
