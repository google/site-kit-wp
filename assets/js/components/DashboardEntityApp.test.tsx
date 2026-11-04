/**
 * DashboardEntityApp component tests.
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
import { VIEW_CONTEXT_ENTITY_DASHBOARD } from '@/js/googlesitekit/constants';
import { mockCreateComponent } from '@tests/js/mock-component-utils';
import {
	createTestRegistry,
	provideModules,
	provideSiteInfo,
	provideUserAuthentication,
	provideUserCapabilities,
	render,
} from '@tests/js/test-utils';
import DashboardEntityApp from './DashboardEntityApp';

jest.mock( './CoreDashboardEffects', () =>
	mockCreateComponent( 'CoreDashboardEffects' )
);
jest.mock( './ModuleDashboardEffects', () =>
	mockCreateComponent( 'ModuleDashboardEffects' )
);
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
jest.mock( '@/js/components/FeaturesMenu', () =>
	mockCreateComponent( 'FeaturesMenu' )
);
jest.mock( './feature-discovery/AddFeaturesButton', () =>
	mockCreateComponent( 'AddFeaturesButton' )
);
jest.mock( './dashboard-sharing/DashboardSharingSettingsButton', () =>
	mockCreateComponent( 'DashboardSharingSettingsButton' )
);
jest.mock( './email-reporting/ManageEmailReportsButton', () =>
	mockCreateComponent( 'ManageEmailReportsButton' )
);
jest.mock( './email-reporting/UserSettingsSelectionPanel', () =>
	mockCreateComponent( 'UserSettingsSelectionPanel' )
);
jest.mock( './notifications/OfflineNotification', () =>
	mockCreateComponent( 'OfflineNotification' )
);
jest.mock( './notifications/SetupCTAOverlays', () =>
	mockCreateComponent( 'SetupCTAOverlays' )
);
jest.mock( '@/js/googlesitekit/widgets/components/WidgetContextRenderer', () =>
	mockCreateComponent( 'WidgetContextRenderer' )
);

describe( 'DashboardEntityApp', () => {
	let registry: ReturnType< typeof createTestRegistry >;

	beforeEach( () => {
		registry = createTestRegistry();
		provideUserAuthentication( registry );
		provideSiteInfo( registry, {
			currentEntityURL: 'https://example.com/hello-world/',
		} );
		provideModules( registry );
		provideUserCapabilities( registry );
	} );

	it( 'should render the date range picker instead of the dropdown when the datePicker feature is enabled', () => {
		const { getByText, queryByText } = render( <DashboardEntityApp />, {
			registry,
			features: [ 'datePicker' ],
			viewContext: VIEW_CONTEXT_ENTITY_DASHBOARD,
		} );

		expect( getByText( /^DateRangePicker/ ) ).toBeInTheDocument();
		expect( queryByText( /^DateRangeSelector/ ) ).not.toBeInTheDocument();
	} );

	it( 'should render the date range dropdown when the datePicker feature is disabled', () => {
		const { getByText, queryByText } = render( <DashboardEntityApp />, {
			registry,
			viewContext: VIEW_CONTEXT_ENTITY_DASHBOARD,
		} );

		expect( getByText( /^DateRangeSelector/ ) ).toBeInTheDocument();
		expect( queryByText( /^DateRangePicker/ ) ).not.toBeInTheDocument();
	} );
} );
