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
import TestRenderer from 'react-test-renderer';

/**
 * Internal dependencies
 */
import { CONTEXT_MAIN_DASHBOARD_TRAFFIC } from '@/js/googlesitekit/widgets/default-contexts';
import { scalePDFValue } from './pdf-scale';
import { SECTION_ICONS } from './section-icons';

describe( 'section icons', () => {
	const TrafficIcon = SECTION_ICONS[ CONTEXT_MAIN_DASHBOARD_TRAFFIC ];

	it( 'renders the icon at the scaled default size', () => {
		const json = JSON.stringify(
			TestRenderer.create( <TrafficIcon color="#161b18" /> ).toJSON()
		);

		expect( json ).toContain( `"width":${ scalePDFValue( 20 ) }` );
		expect( json ).toContain( `"height":${ scalePDFValue( 20 ) }` );
	} );

	it( 'scales a custom icon size', () => {
		const json = JSON.stringify(
			TestRenderer.create(
				<TrafficIcon color="#161b18" size={ 10 } />
			).toJSON()
		);

		expect( json ).toContain( `"width":${ scalePDFValue( 10 ) }` );
	} );
} );
