/**
 * Section icon tests.
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
import { ReactElement } from 'react';
import TestRenderer from 'react-test-renderer';

/**
 * Internal dependencies
 */
import {
	CONTEXT_MAIN_DASHBOARD_CONTENT,
	CONTEXT_MAIN_DASHBOARD_KEY_METRICS,
	CONTEXT_MAIN_DASHBOARD_MONETIZATION,
	CONTEXT_MAIN_DASHBOARD_SPEED,
	CONTEXT_MAIN_DASHBOARD_TRAFFIC,
} from '@/js/googlesitekit/widgets/default-contexts';
import { scalePDFValue } from './pdf-scale';
import { SECTION_ICONS } from './section-icons';

/**
 * Renders a PDF element to a JSON string for content and style assertions.
 *
 * @since 1.183.0
 *
 * @param element PDF element to render.
 * @return JSON string of the rendered tree.
 */
function renderJSON( element: ReactElement ) {
	return JSON.stringify( TestRenderer.create( element ).toJSON() );
}

describe( 'section icons', () => {
	const TrafficIcon = SECTION_ICONS[ CONTEXT_MAIN_DASHBOARD_TRAFFIC ];

	it( 'renders the icon at the scaled default size', () => {
		const trafficIconJSON = renderJSON( <TrafficIcon color="#161b18" /> );

		expect( trafficIconJSON ).toContain(
			`"width":${ scalePDFValue( 20 ) }`
		);
		expect( trafficIconJSON ).toContain(
			`"height":${ scalePDFValue( 20 ) }`
		);
	} );

	it( 'scales the icon size the caller sets', () => {
		const trafficIconJSON = renderJSON(
			<TrafficIcon color="#161b18" size={ 10 } />
		);

		expect( trafficIconJSON ).toContain(
			`"width":${ scalePDFValue( 10 ) }`
		);
	} );

	it( 'draws each icon with its own glyph path', () => {
		const KeyMetricsIcon =
			SECTION_ICONS[ CONTEXT_MAIN_DASHBOARD_KEY_METRICS ];

		// The grid icon draws four 5-pixel squares at corner radius 1.
		const keyMetricsIconJSON = renderJSON(
			<KeyMetricsIcon color="#161b18" />
		);
		expect( keyMetricsIconJSON ).toContain( '"width":5,' );
		expect( keyMetricsIconJSON ).toContain( '"rx":1,' );

		// The first move command differs per glyph, so it identifies each
		// icon's whole path.
		const pathStarts = [
			[
				SECTION_ICONS[ CONTEXT_MAIN_DASHBOARD_TRAFFIC ],
				'M5.45897 16.667C',
			],
			[
				SECTION_ICONS[ CONTEXT_MAIN_DASHBOARD_CONTENT ],
				'M11.021 8.354H13.292C',
			],
			[
				SECTION_ICONS[ CONTEXT_MAIN_DASHBOARD_SPEED ],
				'M8.66797 12.938C',
			],
			[
				SECTION_ICONS[ CONTEXT_MAIN_DASHBOARD_MONETIZATION ],
				'M2.3125 14.375C',
			],
		] as const;
		pathStarts.forEach( ( [ Icon, start ] ) => {
			const iconJSON = renderJSON( <Icon color="#161b18" /> );
			expect( iconJSON ).toContain( start );
		} );
	} );
} );
