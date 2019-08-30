/**
 * AdSensePerformanceWidget component.
 *
 * Site Kit by Google, Copyright 2019 Google LLC
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
import data, { TYPE_MODULES } from 'GoogleComponents/data';
import DataBlock from 'GoogleComponents/data-block.js';
import PreviewBlock from 'GoogleComponents/preview-block';
import {
	getTimeInSeconds,
	readableLargeNumber,
} from 'GoogleUtil';
/**
 * Internal dependencies
 */
import { isDataZeroAdSense } from '../util';

const { __ } = wp.i18n;
const { Component } = wp.element;
const { isUndefined } = lodash;

class AdSensePerformanceWidget extends Component {
	constructor( props ) {
		super( props );

		this.state = {
			isLoading: true,
			refetch: false,
			twentyEightDays: false,
			prev28Days: false,
			error: false,
			message: '',
		};

		this.getAllData = this.getAllData.bind( this );
	}

	componentDidMount() {
		this.getAllData();
	}

	async getAllData() {
		const { handleZeroData } = this.props;

		try {
			const batchRequests = [
				{
					type: TYPE_MODULES,
					identifier: 'adsense',
					datapoint: 'earning-28days',
					priority: 1,
					maxAge: getTimeInSeconds( 'day' ),
					context: [ 'Single', 'Dashboard' ],
					callback: ( result ) => {
						// If there are no impressions, the site is not yet displaying ads.
						if ( result && isDataZeroAdSense( result ) ) {
							handleZeroData();
						}

						this.setState( {
							twentyEightDays: result,
						} );
					},
				},
				{
					type: TYPE_MODULES,
					identifier: 'adsense',
					datapoint: 'earning-prev28days',
					priority: 1,
					maxAge: getTimeInSeconds( 'day' ),
					context: [ 'Single', 'Dashboard' ],
					callback: ( result ) => {
						this.setState( {
							prev28Days: result,
						} );
					},
				},
			];

			// Fetching the data, could from the cache or rest endpoint.
			await data.combinedGet( batchRequests );

			this.setState( {
				isLoading: false,
				error: false,
			} );
		} catch ( err ) {
			this.setState( {
				isLoading: false,
				error: err.code,
				message: err.message,
			} );
		}
	}

	render() {
		const {
			isLoading,
			twentyEightDays,
			prev28Days,
		} = this.state;

		if ( isLoading ) {
			return <PreviewBlock width="100%" height="250px" />;
		}

		const dataBlocks = twentyEightDays.totals ? [
			{
				className: 'googlesitekit-data-block--page-rpm',
				title: __( 'Page RPM', 'google-site-kit' ),
				datapoint: readableLargeNumber( twentyEightDays.totals[ 1 ] ),
				change: ( ! isUndefined( prev28Days.totals ) ) ? prev28Days.totals[ 1 ] : 0,
				changeDataUnit: '%',
			},
			{
				className: 'googlesitekit-data-block--impression',
				title: __( 'Impressions', 'google-site-kit' ),
				datapoint: readableLargeNumber( twentyEightDays.totals[ 2 ] ),
				change: ! isUndefined( prev28Days.totals ) ? prev28Days.totals[ 2 ] : 0,
				changeDataUnit: '%',
			},
		] : [];

		return (
			<section className="mdc-layout-grid">
				<div className="mdc-layout-grid__inner">
					{ dataBlocks.map( ( block, i ) => {
						return (
							<div key={ i } className="
								mdc-layout-grid__cell
								mdc-layout-grid__cell--align-top
								mdc-layout-grid__cell--span-2-phone
								mdc-layout-grid__cell--span-2-tablet
								mdc-layout-grid__cell--span-4-desktop
							">
								<DataBlock
									stat={ i }
									className={ block.className }
									title={ block.title }
									datapoint={ block.datapoint }
									change={ block.change }
									changeDataUnit={ block.changeDataUnit }
									context={ block.context }
									selected={ block.selected }
									handleStatSelection={ block.handleStatSelection }
								/>
							</div>
						);
					} ) }
				</div>
			</section>
		);
	}
}

export default AdSensePerformanceWidget;

