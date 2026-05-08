/**
 * Data store utilities for transforming names to a certain case tests.
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
import {
	camelCaseToPascalCase,
	camelCaseToConstantCase,
	hyphenCaseToPascalCase,
} from './transform-case';

describe( 'camelCaseToPascalCase', () => {
	it.each( [
		[ 'testSetting', 'TestSetting' ],
		[ 'propertyID', 'PropertyID' ],
		[
			// This is an expected "issue" with this function: It does not
			// transform abbreviations as it should - not a huge concern
			// for now though, these cases are currently handled manually.
			// But preferably, this should result in "AMPExperimentJSON",
			// per Site Kit naming conventions.
			'ampExperimentJSON',
			'AmpExperimentJSON',
		],
	] )( 'transforms "%s" names to "%s"', ( name, expected ) => {
		expect( camelCaseToPascalCase( name ) ).toEqual( expected );
	} );
} );

describe( 'camelCaseToConstantCase', () => {
	it.each( [
		[ 'testSetting', 'TEST_SETTING' ],
		[ 'propertyID', 'PROPERTY_ID' ],
		[ 'ampExperimentJSON', 'AMP_EXPERIMENT_JSON' ],
	] )( 'transforms "%s" names to "%s"', ( name, expected ) => {
		expect( camelCaseToConstantCase( name ) ).toEqual( expected );
	} );
} );

describe( 'hyphen-caseToPascalCase', () => {
	it.each( [
		[ 'test-setting', 'TestSetting' ],
		[ 'property', 'Property' ],
		[ 'ampExperiment-json', 'AmpExperimentJson' ],
		[ 'amp-experiment-json', 'AmpExperimentJson' ],
	] )( 'transforms "%s" names to "%s"', ( name, expected ) => {
		expect( hyphenCaseToPascalCase( name ) ).toEqual( expected );
	} );
} );
