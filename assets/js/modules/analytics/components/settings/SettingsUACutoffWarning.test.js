/**
 * SettingsUACutoffWarning component tests.
 *
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
	render,
	createTestRegistry,
} from '../../../../../../tests/js/test-utils';
import {
	provideModules,
	provideSiteInfo,
} from '../../../../../../tests/js/utils';
import { getDateString, getPreviousDate, stringToDate } from '../../../../util';
import { CORE_USER } from '../../../../googlesitekit/datastore/user/constants';
import { UA_CUTOFF_DATE } from '../../constants';
import SettingsUACutoffWarning from './SettingsUACutoffWarning';

describe( 'SettingsUACutoffWarning', () => {
	let registry;

	const date = stringToDate( UA_CUTOFF_DATE );
	date.setDate( date.getDate() + 1 );
	const dayAfterCutoffDate = getDateString( date );

	beforeEach( () => {
		registry = createTestRegistry();
		provideSiteInfo( registry );
	} );

	it.each( [
		[
			'before the UA cutoff date',
			getPreviousDate( UA_CUTOFF_DATE, 1 ),
			'Your current Universal Analytics property will stop collecting data on July 1, 2023',
		],
		[
			'on the UA cutoff date',
			UA_CUTOFF_DATE,
			'Your current Universal Analytics property stopped collecting data on July 1, 2023',
		],
		[
			'after the UA cutoff date',
			dayAfterCutoffDate,
			'Your current Universal Analytics property stopped collecting data on July 1, 2023',
		],
	] )(
		'should render the UA cutoff warning notice when Analytics is connected while GA4 is not, and the date is %s (%s)',
		( _, referenceDate, expectedNoticeText ) => {
			provideModules( registry, [
				{
					active: true,
					connected: true,
					slug: 'analytics',
				},
				{
					active: true,
					connected: false,
					slug: 'analytics-4',
				},
			] );

			registry.dispatch( CORE_USER ).setReferenceDate( referenceDate );

			const { container } = render( <SettingsUACutoffWarning />, {
				registry,
				features: [ 'ga4Reporting' ],
			} );

			expect( container ).toMatchSnapshot();
			expect( container ).toHaveTextContent( expectedNoticeText );
		}
	);

	it.each( [
		[
			'Analytics is not connected',
			{
				analyticsConnected: false,
				analytics4Connected: false,
				referenceDate: UA_CUTOFF_DATE,
			},
		],
		[
			'Analytics 4 is connected',
			{
				analyticsConnected: true,
				analytics4Connected: true,
				referenceDate: UA_CUTOFF_DATE,
			},
		],
	] )(
		'should not render the UA cutoff warning notice when %s',
		( _, { analyticsConnected, analytics4Connected, referenceDate } ) => {
			provideModules( registry, [
				{
					active: true,
					connected: analyticsConnected,
					slug: 'analytics',
				},
				{
					active: true,
					connected: analytics4Connected,
					slug: 'analytics-4',
				},
			] );

			registry.dispatch( CORE_USER ).setReferenceDate( referenceDate );

			const { container } = render( <SettingsUACutoffWarning />, {
				registry,
				features: [ 'ga4Reporting' ],
			} );

			expect( container ).toBeEmptyDOMElement();
		}
	);
} );
