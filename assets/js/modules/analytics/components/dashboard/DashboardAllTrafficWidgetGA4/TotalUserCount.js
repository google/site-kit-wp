/**
 * TotalUserCount component
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
 * External dependencies
 */
import PropTypes from 'prop-types';
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { Fragment } from '@wordpress/element';
import { Icon, chevronRight } from '@wordpress/icons';
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { CORE_USER } from '../../../../../googlesitekit/datastore/user/constants';
import {
	numFmt,
	calculateChange,
	getAvailableDateRanges,
} from '../../../../../util';
import ChangeArrow from '../../../../../components/ChangeArrow';
import PreviewBlock from '../../../../../components/PreviewBlock';
import ReportError from '../../../../../components/ReportError';
import { CORE_UI } from '../../../../../googlesitekit/datastore/ui/constants';
import {
	UI_DIMENSION_COLOR,
	UI_DIMENSION_VALUE,
} from '../../../datastore/constants';
import Link from '../../../../../components/Link';
import GatheringDataNotice, {
	NOTICE_STYLE,
} from '../../../../../components/GatheringDataNotice';
const { useSelect, useDispatch } = Data;

export default function TotalUserCount( props ) {
	const { loaded, error, report, dimensionValue, gatheringData } = props;

	const dateRange = useSelect( ( select ) =>
		select( CORE_USER ).getDateRange()
	);

	const { setValues } = useDispatch( CORE_UI );
	const showAllUsers = () => {
		setValues( {
			[ UI_DIMENSION_VALUE ]: '',
			[ UI_DIMENSION_COLOR ]: '',
		} );
	};

	if ( ! loaded ) {
		return (
			// Height is based on real count desktop height (100px), minus 10px for the extra margin.
			// For extra large desktop viewports, it is increased via CSS to 106px, to match the respective
			// real count height for those devices (116px).
			// TODO: Modify `PreviewBlock` to allow for different sizes per breakpoint.
			<PreviewBlock
				className="googlesitekit-widget--analyticsAllTraffic__totalcount--loading"
				width="220px"
				height="90px"
				shape="square"
			/>
		);
	}

	if ( error ) {
		return <ReportError moduleSlug="analytics-4" error={ error } />;
	}

	const { totals } = report || {};
	const [ current, previous ] = totals || [];
	const change = calculateChange(
		previous?.metricValues?.[ 0 ]?.value,
		current?.metricValues?.[ 0 ]?.value
	);

	let currentDateRangeLabel = null;
	const currentDateRangeDays = getAvailableDateRanges()[ dateRange ]?.days;
	if ( currentDateRangeDays ) {
		currentDateRangeLabel = sprintf(
			/* translators: %s: number of days */
			__( 'compared to the previous %s days', 'google-site-kit' ),
			currentDateRangeDays
		);
	}

	return (
		<div className="googlesitekit-widget--analyticsAllTraffic__totalcount googlesitekit-data-block">
			<h3 className="googlesitekit-subheading-1 googlesitekit-data-block__title">
				{ ! dimensionValue && (
					<span>{ __( 'All Users', 'google-site-kit' ) } </span>
				) }
				{ dimensionValue && (
					<Fragment>
						{ dimensionValue && (
							<Link onClick={ showAllUsers }>
								{ __( 'All Users', 'google-site-kit' ) }
							</Link>
						) }
						{ ! dimensionValue && (
							<span>
								{ __( 'All Users', 'google-site-kit' ) }
							</span>
						) }
						<Icon
							icon={ chevronRight }
							size="18"
							fill="currentColor"
						/>
						<span>{ dimensionValue }</span>
					</Fragment>
				) }
			</h3>

			{ gatheringData && (
				<GatheringDataNotice style={ NOTICE_STYLE.LARGE } />
			) }

			{ ! gatheringData && (
				<Fragment>
					{ !! current?.metricValues?.[ 0 ]?.value && (
						<div className="googlesitekit-data-block__datapoint">
							{ numFmt( current?.metricValues?.[ 0 ]?.value ) }
						</div>
					) }
					<div className="googlesitekit-data-block__change">
						{ change && (
							<span className="googlesitekit-data-block__arrow">
								<ChangeArrow
									direction={ 0 <= change ? 'up' : 'down' }
									width={ 9 }
									height={ 9 }
								/>
							</span>
						) }
						<span
							className={ classnames(
								'googlesitekit-data-block__value',
								{
									'googlesitekit-data-block__value--up':
										0 < change,
									'googlesitekit-data-block__value--down':
										0 > change,
								}
							) }
						>
							{ numFmt( Math.abs( change ), {
								style: 'percent',
								maximumFractionDigits: 1,
							} ) }
						</span>
						<span className="googlesitekit-data-block__suffix">
							{ currentDateRangeLabel }
						</span>
					</div>
				</Fragment>
			) }
		</div>
	);
}

TotalUserCount.propTypes = {
	loaded: PropTypes.bool,
	report: PropTypes.object,
	dimensionValue: PropTypes.string,
	gatheringData: PropTypes.bool,
};
