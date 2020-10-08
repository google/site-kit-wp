/**
 * applyEntityToReportPath tests.
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

import applyEntityToReportPath from './applyEntityToReportPath.js';

describe( 'applyEntityToReportPath', () => {
	const currentEntityURL = 'https://domain.com/pathname/';
	const reportPath = '/report/visitors-overview/a1234w5678p2468/';

	it( 'returns the appended currentEntityURL', async () => {
		expect( applyEntityToReportPath( currentEntityURL, reportPath ) ).toMatch( '/report/visitors-overview/a1234w5678p2468/_r.drilldown=analytics.pagePath:~2Fpathname~2F' );
	} );
	it( 'returns original reportPath if currentEntityURL is null, false or undefined', async () => {
		expect( applyEntityToReportPath( null, reportPath ) ).toMatch( '/report/visitors-overview/a1234w5678p2468/' );
		expect( applyEntityToReportPath( false, reportPath ) ).toMatch( '/report/visitors-overview/a1234w5678p2468/' );
		expect( applyEntityToReportPath( undefined, reportPath ) ).toMatch( '/report/visitors-overview/a1234w5678p2468/' );
	} );
	it( 'always has a forward slash after the reportPath', async () => {
		expect( applyEntityToReportPath( currentEntityURL, '/report/visitors-overview/a1234w5678p2468' ) ).toMatch( '/report/visitors-overview/a1234w5678p2468/_r.drilldown=analytics.pagePath:~2Fpathname~2F' );
	} );

	it( 'throws an error if currentEntityURL is not a valid URL', async () => {
		expect( () => {
			applyEntityToReportPath( 'not a url', reportPath );
		} ).toThrow( 'currentEntityURL must be a valid URL.' );
	} );
} );
