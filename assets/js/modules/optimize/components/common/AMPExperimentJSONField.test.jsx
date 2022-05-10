/**
 * AMPExperimentJSONField component tests.
 *
 * Site Kit by Google, Copyright 2021 Google LLC
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
import AMPExperimentJSONField from './AMPExperimentJSONField';
import { render } from '../../../../../../tests/js/test-utils';
import { MODULES_OPTIMIZE } from '../../datastore/constants';
import { CORE_SITE } from '../../../../googlesitekit/datastore/site/constants';
import { MODULES_ANALYTICS } from '../../../analytics/datastore/constants';

describe( 'AMPExperimentJSONField', () => {
	it( 'should render with all arguments passed', () => {
		const setupRegistry = ( registry ) => {
			registry
				.dispatch( MODULES_OPTIMIZE )
				.setAMPExperimentJSON( 'amp-experiment-test' );
			registry
				.dispatch( CORE_SITE )
				.receiveSiteInfo( { ampMode: 'standard' } );
			registry.dispatch( MODULES_ANALYTICS ).setUseSnippet( true );
		};

		const { container } = render( <AMPExperimentJSONField />, {
			setupRegistry,
		} );

		expect( container.querySelector( '.mdc-text-field' ) ).not.toEqual(
			null
		);
	} );

	it( 'should not render with no amp mode', () => {
		const setupRegistry = ( registry ) => {
			registry
				.dispatch( MODULES_OPTIMIZE )
				.setAMPExperimentJSON( 'amp-experiment-test' );
			registry.dispatch( CORE_SITE ).receiveSiteInfo( { ampMode: '' } );
			registry.dispatch( MODULES_ANALYTICS ).setUseSnippet( true );
		};

		const { container } = render( <AMPExperimentJSONField />, {
			setupRegistry,
		} );

		expect( container.querySelector( '.mdc-text-field' ) ).toEqual( null );
		expect(
			container.querySelector( '.googlesitekit-error-text' )
		).toEqual( null );
	} );

	it( 'should not render with a false use snippet', () => {
		const setupRegistry = ( registry ) => {
			registry
				.dispatch( MODULES_OPTIMIZE )
				.setAMPExperimentJSON( 'amp-experiment-test' );
			registry
				.dispatch( CORE_SITE )
				.receiveSiteInfo( { ampMode: 'standard' } );
			registry.dispatch( MODULES_ANALYTICS ).setUseSnippet( false );
		};

		const { container } = render( <AMPExperimentJSONField />, {
			setupRegistry,
		} );

		expect( container.querySelector( '.mdc-text-field' ) ).toEqual( null );
		expect(
			container.querySelector( '.googlesitekit-error-text' )
		).toEqual( null );
	} );

	it( 'should display an error message with an invalid amp experiment json', () => {
		const setupRegistry = ( registry ) => {
			registry.dispatch( MODULES_OPTIMIZE ).setAMPExperimentJSON( 10 );
			registry
				.dispatch( CORE_SITE )
				.receiveSiteInfo( { ampMode: 'standard' } );
			registry.dispatch( MODULES_ANALYTICS ).setUseSnippet( true );
		};

		const { container } = render( <AMPExperimentJSONField />, {
			setupRegistry,
		} );

		expect( container.querySelector( '.mdc-text-field' ) ).not.toEqual(
			null
		);
		expect(
			container.querySelector( '.googlesitekit-error-text' )
		).not.toEqual( null );
	} );
} );
