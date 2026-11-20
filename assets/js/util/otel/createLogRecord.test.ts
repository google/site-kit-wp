/**
 * OTLP log record tests.
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
import createLogRecord from './createLogRecord';

function toObject(
	attributes: { key: string; value: { stringValue: string } }[]
) {
	return Object.fromEntries(
		attributes.map( ( { key, value } ) => [ key, value.stringValue ] )
	);
}

describe( 'createLogRecord', () => {
	it( 'builds the payload shape the service reads', () => {
		// eslint-disable-next-line sitekit/no-direct-date
		jest.spyOn( Date, 'now' ).mockReturnValue( 1790000000000 );

		const error = new TypeError( 'Boom' );
		error.stack =
			'TypeError: Boom\n    at Foo (https://example.com/main.js:1:2)';

		const payload = createLogRecord(
			error,
			{ viewContext: 'mainDashboard' },
			{
				pluginVersion: '1.188.0',
				siteURL: 'https://example.com/',
				activeModules: [ 'search-console', 'analytics-4' ],
				enabledFeatures: [],
			}
		);

		const [ { resource, scopeLogs } ] = payload.resourceLogs;
		const [ { scope, logRecords } ] = scopeLogs;
		const [ record ] = logRecords;

		expect( toObject( resource.attributes ) ).toEqual( {
			'service.name': 'site-kit-wp',
			'service.version': '1.188.0',
			'sitekit.site_url': 'https://example.com/',
			'sitekit.modules_active': 'search-console,analytics-4',
		} );
		expect( scope.name ).toBe( 'sitekit.browser' );
		expect( record ).toMatchObject( {
			timeUnixNano: '1790000000000000000',
			severityNumber: 17,
			severityText: 'ERROR',
			body: { stringValue: 'Boom' },
		} );
		expect( toObject( record.attributes ) ).toMatchObject( {
			'exception.type': 'TypeError',
			'exception.message': 'Boom',
			'exception.stacktrace': error.stack,
			'sitekit.view_context': 'mainDashboard',
		} );
		// Empty values are dropped rather than sent blank.
		expect( toObject( record.attributes ) ).not.toHaveProperty(
			'sitekit.component_stack'
		);
	} );
} );
