/**
 * appendEntityToPath tests.
 *
 * Site Kit by Google, Copyright 2020 Google LLC
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

import appendEntityToPath from './appendEntityToPath.js';

describe( 'appendEntityToPath', () => {
	const entity = 'https://domain.com/pathname/';
	const path = '/report/visitors-overview/a1234w5678p2468/';

	it( 'returns the appended entity', async () => {
		expect( appendEntityToPath( entity, path ) ).toMatch( '/report/visitors-overview/a1234w5678p2468/_r.drilldown=analytics.pagePath:~2Fpathname~2F' );
	} );
	it( 'returns original path if entity is null, false or undefined', async () => {
		expect( appendEntityToPath( null, path ) ).toMatch( '/report/visitors-overview/a1234w5678p2468/' );
		expect( appendEntityToPath( false, path ) ).toMatch( '/report/visitors-overview/a1234w5678p2468/' );
		expect( appendEntityToPath( undefined, path ) ).toMatch( '/report/visitors-overview/a1234w5678p2468/' );
	} );
} );
