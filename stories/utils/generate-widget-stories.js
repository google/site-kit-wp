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
import { storiesOf, Story } from '@storybook/react';
import { Component } from 'react';

/**
 * Internal dependencies
 */
import Widgets from 'googlesitekit-widgets';
import { STORE_NAME as CORE_SITE } from '../../assets/js/googlesitekit/datastore/site/constants';
import { STORE_NAME as CORE_MODULES } from '../../assets/js/googlesitekit/modules/datastore/constants';
import { WithTestRegistry } from '../../tests/js/utils';
const { components: { Widget } } = Widgets;

/**
 * Generates a function to set up registry for widget stories.
 *
 * @since n.e.x.t
 *
 * @param {string} moduleSlug Module slug.
 * @param {string|null} url Current entity URL.
 * @param {Function} cb Callback for additional setup.
 * @return {Function} A function to set up registry for widget stories.
 */
function getSetupRegistry( moduleSlug, url, cb = () => {} ) {
	return ( { dispatch } ) => {
		cb( { dispatch } );

		dispatch( CORE_SITE ).receiveSiteInfo( {
			referenceSiteURL: null,
			currentEntityURL: url,
		} );

		dispatch( CORE_MODULES ).receiveGetModules( [
			{
				slug: moduleSlug,
				active: true,
				connected: true,
			},
		] );
	};
}

/**
 * Generates stories for a report based widget using provided data.
 *
 * @since n.e.x.t
 *
 * @param {Object}    args               Widget arguments.
 * @param {string}    args.moduleSlug    Module slug.
 * @param {string}    args.datastore     Module datastore name.
 * @param {string}    args.group         Stories group name.
 * @param {Array}     args.data          Widget data.
 * @param {Object}    args.options       Arguments for report requests.
 * @param {Object} args.variantCallbacks Custom callbacks to be run for each of the variants.
 * @param {Component} args.component     Widget component.
 * @param {boolean}   args.wrapWidget    Whether to wrap in default <Widget> component. Default true.
 * @return {Story} Generated story.
 */
export function generateReportBasedWidgetStories( {
	moduleSlug,
	datastore,
	group,
	data,
	options,
	variantCallbacks = {},
	component: WidgetComponent,
	wrapWidget = true,
} ) {
	const stories = storiesOf( group, module );

	const variants = {
		Loaded: ( { dispatch } ) => {
			if ( variantCallbacks.Loaded ) {
				variantCallbacks.Loaded( dispatch, data, options );
			} else {
				dispatch( datastore ).receiveGetReport( data, { options } );
			}
		},
		'Data Unavailable': ( { dispatch } ) => {
			if ( variantCallbacks[ 'Data Unavailable' ] ) {
				variantCallbacks[ 'Data Unavailable' ]( dispatch, data, options );
			} else {
				dispatch( datastore ).receiveGetReport( [], { options } );
			}
		},
		Error: ( { dispatch } ) => {
			if ( variantCallbacks.Error ) {
				variantCallbacks.Error( dispatch, data, options );
			} else {
				const error = {
					code: 'missing_required_param',
					message: 'Request parameter is empty: metrics.',
					data: {},
				};

				dispatch( datastore ).receiveError( error, 'getReport', [ options ] );
				dispatch( datastore ).finishResolution( 'getReport', [ options ] );
			}
		},
	};

	const widget = wrapWidget ? <Widget><WidgetComponent /></Widget> : <WidgetComponent />;

	Object.keys( variants ).forEach( ( variant ) => {
		stories.add( variant, () => (
			<WithTestRegistry callback={ getSetupRegistry( moduleSlug, options.url || null, variants[ variant ] ) }>
				{ widget }
			</WithTestRegistry>
		) );
	} );

	return stories;
}
