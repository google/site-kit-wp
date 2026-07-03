/**
 * AdSense module widget registration tests.
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
import { WPDataRegistry } from '@wordpress/data/build-types/registry';

/**
 * Internal dependencies
 */
import {
	createWidgets,
	registerWidgets as registerDefaultWidgets,
} from '@/js/googlesitekit/widgets';
import { CORE_WIDGETS } from '@/js/googlesitekit/widgets/datastore/constants';
import { AREA_MAIN_DASHBOARD_MONETIZATION_PRIMARY } from '@/js/googlesitekit/widgets/default-areas';
import getModuleOverviewPDFData from '@/js/modules/adsense/components/module/ModuleOverviewWidget/getPDFData';
import { createTestRegistry } from '../../../../../tests/js/utils';
import { registerWidgets } from './index';

describe( 'AdSense widget registrations', () => {
	let registry: WPDataRegistry;
	let widgets: ReturnType< typeof createWidgets >;

	beforeEach( () => {
		registry = createTestRegistry();
		widgets = createWidgets( registry );
		registerDefaultWidgets( widgets );
	} );

	it( 'should register the Earning performance over time PDF config on the overview widget', () => {
		registerWidgets( widgets );

		const widget = registry
			.select( CORE_WIDGETS )
			.getWidget( 'adsenseModuleOverview' );

		expect( widget.pdf.label ).toBe( 'Earning performance over time' );
		expect( widget.pdf.getData ).toBe( getModuleOverviewPDFData );
		// The PDF component loads lazily and exposes `preload` so the
		// orchestrator can resolve its chunk before rendering.
		expect( typeof widget.pdf.Component.preload ).toBe( 'function' );
	} );

	it( 'should title the Monetization PDF section through the area pdfTitle', () => {
		const area = registry
			.select( CORE_WIDGETS )
			.getWidgetArea( AREA_MAIN_DASHBOARD_MONETIZATION_PRIMARY );

		expect( area.pdfTitle ).toBe( 'Monetization' );
	} );
} );
