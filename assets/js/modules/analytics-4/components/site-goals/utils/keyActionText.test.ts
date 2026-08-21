/**
 * Site Goals Key action label and caption tests.
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
import { getEventNameSubtitle, getLeadEventsSubtitle } from './keyActionText';

describe( 'getEventNameSubtitle', () => {
	it( 'names the event behind the Key action total', () => {
		expect( getEventNameSubtitle( 'purchase' ) ).toBe(
			'“purchase” events'
		);
	} );
} );

describe( 'getLeadEventsSubtitle', () => {
	it( 'names the event when one lead event is detected', () => {
		expect( getLeadEventsSubtitle( [ 'contact' ] ) ).toBe(
			'“contact” events'
		);
	} );

	it( 'counts the event types when several lead events are detected', () => {
		expect( getLeadEventsSubtitle( [ 'contact', 'generate_lead' ] ) ).toBe(
			'2 event types'
		);
	} );

	it( 'counts zero event types when no lead event is detected', () => {
		expect( getLeadEventsSubtitle( [] ) ).toBe( '0 event types' );
	} );
} );
