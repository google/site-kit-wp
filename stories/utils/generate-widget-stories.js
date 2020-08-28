/**
 * Utility function to generate stories for widgets.
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
import { storiesOf } from '@storybook/react';

/**
 * Internal dependencies
 */
import { STORE_NAME as CORE_SITE } from '../../assets/js/googlesitekit/datastore/site/constants';
import { STORE_NAME as CORE_MODULES } from '../../assets/js/googlesitekit/modules/datastore/constants';
import { WithTestRegistry } from '../../tests/js/utils';

function registrySetup( url, cb = () => {} ) {
	return ( { dispatch } ) => {
		cb( { dispatch } );

		dispatch( CORE_SITE ).receiveSiteInfo( {
			referenceSiteURL: null,
			currentEntityURL: url,
		} );

		dispatch( CORE_MODULES ).receiveGetModules( [
			{
				slug: 'analytics',
				active: true,
				connected: true,
			},
		] );
	};
}

export function generateWidgetStories( { datastore, group, data, options, component: Component } ) {
	const stories = storiesOf( group, module );

	const variants = {
		Loaded: ( { dispatch } ) => {
			dispatch( datastore ).receiveGetReport( data, { options } );
		},
		'Data Unavailable': ( { dispatch } ) => {
			dispatch( datastore ).receiveGetReport( [], { options } );
		},
		Error: ( { dispatch } ) => {
			const error = {
				code: 'missing_required_param',
				message: 'Request parameter is empty: metrics.',
				data: {},
			};

			dispatch( datastore ).receiveError( error, 'getReport', [ options ] );
			dispatch( datastore ).finishResolution( 'getReport', [ options ] );
		},
	};

	Object.keys( variants ).forEach( ( variant ) => {
		stories.add( variant, () => (
			<WithTestRegistry callback={ registrySetup( options.url || null, variants[ variant ] ) }>
				<Component />
			</WithTestRegistry>
		) );
	} );
}
