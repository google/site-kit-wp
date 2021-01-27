/**
 * TotalUserCount component
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
 * External dependencies
 */
import PropTypes from 'prop-types';
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { Fragment } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { CORE_USER } from '../../../../../googlesitekit/datastore/user/constants';
import { numFmt, calculateChange } from '../../../../../util';
import { getAvailableDateRanges } from '../../../../../util/date-range';
import ChangeArrow from '../../../../../components/ChangeArrow';
import PreviewBlock from '../../../../../components/PreviewBlock';
import ReportError from '../../../../../components/ReportError';
const { useSelect } = Data;

export default function TotalUserCount( { loaded, error, report, dimensionValue } ) {
	const dateRange = useSelect( ( select ) => select( CORE_USER ).getDateRange() );

	if ( ! loaded ) {
		return (
			<PreviewBlock
				className="googlesitekit-widget--analyticsAllTraffic__totalcount--loading"
				width="220px"
				height="130px"
				shape="square"
			/>
		);
	}

	if ( error ) {
		return <ReportError moduleSlug="analytics" error={ error } />;
	}

	const { totals } = report?.[ 0 ]?.data || {};
	const [ current, previous ] = totals || [];
	const change = calculateChange( previous?.values?.[ 0 ], current?.values?.[ 0 ] );

	let currentDateRangeLabel = null;
	const currentDateRangeDays = getAvailableDateRanges()[ dateRange ]?.days;
	if ( currentDateRangeDays ) {
		currentDateRangeLabel = sprintf(
			/* translators: %s number of days */
			__( 'compared to the last %s days', 'google-site-kit' ),
			currentDateRangeDays,
		);
	}

	return (
		<div className="googlesitekit-widget--analyticsAllTraffic__totalcount googlesitekit-data-block">
			<h3 className="googlesitekit-subheading-1 googlesitekit-data-block__title">
				{ ! dimensionValue && __( 'All Users', 'google-site-kit' ) }
				{ dimensionValue && (
					<Fragment>
						{ __( 'Users', 'google-site-kit' ) }
						<span>{ dimensionValue[ 0 ].toUpperCase() }{ dimensionValue.substring( 1 ) }</span>
					</Fragment>
				) }
			</h3>
			<div className="googlesitekit-data-block__datapoint">
				{ numFmt( current?.values?.[ 0 ] ) }
			</div>
			<div className="googlesitekit-data-block__change">
				<span className="googlesitekit-data-block__arrow">
					<ChangeArrow
						direction={ 0 <= change ? 'up' : 'down' }
						width={ 9 }
						height={ 9 }
					/>
				</span>
				<span className={ classnames(
					'googlesitekit-data-block__value',
					{
						'googlesitekit-data-block__value--up': 0 <= change,
						'googlesitekit-data-block__value--down': 0 > change,
					},
				) }>
					{ numFmt( Math.abs( change ), { style: 'percent', maximumFractionDigits: 1 } ) }
				</span>
				<span className="googlesitekit-data-block__suffix">
					{ currentDateRangeLabel }
				</span>
			</div>
		</div>
	);
}

TotalUserCount.propTypes = {
	loaded: PropTypes.bool,
	report: PropTypes.arrayOf( PropTypes.object ),
	dimensionValue: PropTypes.string,
};
