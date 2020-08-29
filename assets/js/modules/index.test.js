/**
 * Common Module tests.
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

/**
 * External dependencies
 */
import fs from 'fs';
import path from 'path';

/**
 * Internal dependencies
 */
import FIXTURES from '../googlesitekit/modules/datastore/fixtures.json';
import { convertArrayListToKeyedObjectMap } from '../util/convert-array-to-keyed-object-map';

const directories = ( relativePath ) => fs.readdirSync( path.join( __dirname, relativePath ) )
	.filter( ( name ) => fs.lstatSync( path.join( __dirname, relativePath, name ) ).isDirectory() );

const getComponentNames = ( componentPath ) => fs.readdirSync( componentPath )
	.filter( ( name ) => ! /^index|\.test\.js$/.test( name ) )
	.map( ( name ) => name.replace( /\..*/, '' ) );

describe( 'all modules', () => {
	const fixturesKeyValue = convertArrayListToKeyedObjectMap( FIXTURES, 'slug' );

	beforeAll( () => {
		global._googlesitekitLegacyData = { modules: fixturesKeyValue };
	} );

	describe.each( directories( '.' ) )( `%s`, ( moduleSlug ) => {
		describe.each( directories( `${ moduleSlug }/components` ) )( `components/%s`, ( componentDir ) => {
			const componentDirPath = path.join( __dirname, moduleSlug, 'components', componentDir );

			it( 'has an index module with all components exported', () => {
				// eslint-disable-next-line no-unused-vars
				const { default: _, ...indexExports } = require( `${ componentDirPath }/index.js` );
				const indexExportNames = Object.keys( indexExports ).sort();
				const componentNames = getComponentNames( componentDirPath ).sort();
				expect( indexExportNames ).toEqual( componentNames );
			} );
		} );
	} );
} );
