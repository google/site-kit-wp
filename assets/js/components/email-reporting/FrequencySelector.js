/**
 * FrequencySelector component.
 *
 * Site Kit by Google, Copyright 2025 Google LLC
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
import classnames from 'classnames';
import PropTypes from 'prop-types';

/**
 * WordPress dependencies
 */
import { __, _x, sprintf } from '@wordpress/i18n';
import { useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { useSelect, useDispatch } from 'googlesitekit-data';
import { CORE_SITE } from '@/js/googlesitekit/datastore/site/constants';
import {
	CORE_USER,
	EMAIL_REPORT_FREQUENCIES,
} from '@/js/googlesitekit/datastore/user/constants';
import { Fragment } from 'react';
import Typography from '@/js/components/Typography';

export default function FrequencySelector( { isUserSubscribed } ) {
	const DAY_NAMES = useMemo(
		() => [
			_x( 'Sunday', 'day name', 'google-site-kit' ),
			_x( 'Monday', 'day name', 'google-site-kit' ),
			_x( 'Tuesday', 'day name', 'google-site-kit' ),
			_x( 'Wednesday', 'day name', 'google-site-kit' ),
			_x( 'Thursday', 'day name', 'google-site-kit' ),
			_x( 'Friday', 'day name', 'google-site-kit' ),
			_x( 'Saturday', 'day name', 'google-site-kit' ),
		],
		[]
	);

	function dayNameFromIndex( index ) {
		const i =
			Number.isInteger( index ) && index >= 0 && index <= 6 ? index : 1;
		return DAY_NAMES[ i ];
	}

	const startOfWeek = useSelect( ( select ) =>
		select( CORE_SITE ).getStartOfWeek()
	);

	const frequency = useSelect( ( select ) =>
		select( CORE_USER ).getEmailReportingFrequency()
	);

	const savedFrequency = useSelect( ( select ) =>
		select( CORE_USER ).getEmailReportingSavedFrequency()
	);

	const { setEmailReportingFrequency } = useDispatch( CORE_USER );

	const weeklyDescription = sprintf(
		/* translators: %s: localized day-of-week name (e.g. Monday). */
		__( 'Sent every %s', 'google-site-kit' ),
		dayNameFromIndex( startOfWeek )
	);

	const frequencyCopy = {
		weekly: {
			label: __( 'Weekly', 'google-site-kit' ),
			period: __( 'Last 7 days', 'google-site-kit' ),
			description: weeklyDescription,
		},
		monthly: {
			label: __( 'Monthly', 'google-site-kit' ),
			period: __( 'Last 28 days', 'google-site-kit' ),
			description: __(
				'Sent on the 1st of each month',
				'google-site-kit'
			),
		},
		quarterly: {
			label: __( 'Quarterly', 'google-site-kit' ),
			period: __( 'Last 90 days', 'google-site-kit' ),
			description: __(
				'Sent on the 1st of each quarter',
				'google-site-kit'
			),
		},
	};

	// Allow keyboard users to open the frequency selector
	// using Enter or Space keys.
	function handleKeyDown( event, reportFrequency ) {
		if (
			event.key === ' ' ||
			event.key === 'Spacebar' ||
			event.key === 'Enter'
		) {
			event.preventDefault();
			setEmailReportingFrequency( reportFrequency );
		}
	}

	// Determine which column the saved frequency is in (0, 1, or 2).
	const savedFrequencyIndex =
		EMAIL_REPORT_FREQUENCIES.indexOf( savedFrequency );
	const showCurrentSubscription =
		isUserSubscribed && savedFrequencyIndex !== -1;

	return (
		<Fragment>
			<Typography
				className="googlesitekit-frequency-selector-title"
				type="label"
				size="small"
				as="h3"
			>
				{ __( 'Frequency', 'google-site-kit' ) }
			</Typography>
			{ showCurrentSubscription && (
				<div className="googlesitekit-frequency-selector__badge-row">
					{ EMAIL_REPORT_FREQUENCIES.map(
						( reportFrequency, index ) => (
							<div
								key={ reportFrequency }
								className="googlesitekit-frequency-selector__badge-cell"
							>
								{ index === savedFrequencyIndex && (
									<Typography
										className="googlesitekit-frequency-selector__current-subscription"
										type="body"
										size="small"
										as="div"
									>
										{ __(
											'Current subscription',
											'google-site-kit'
										) }
									</Typography>
								) }
							</div>
						)
					) }
				</div>
			) }
			<div
				className="googlesitekit-frequency-selector"
				role="radiogroup"
				aria-label={ __( 'Frequency', 'google-site-kit' ) }
			>
				{ EMAIL_REPORT_FREQUENCIES.map( ( reportFrequency ) => {
					const isSelected = frequency === reportFrequency;
					const { label, period, description } =
						frequencyCopy[ reportFrequency ] || {};

					return (
						<div
							key={ reportFrequency }
							className={ classnames(
								'googlesitekit-frequency-selector__card',
								{
									'googlesitekit-frequency-selector__card--selected':
										isSelected,
								}
							) }
							role="radio"
							aria-checked={ isSelected }
							tabIndex={ 0 }
							onClick={ () =>
								setEmailReportingFrequency( reportFrequency )
							}
							onKeyDown={ ( event ) =>
								handleKeyDown( event, reportFrequency )
							}
						>
							<div className="googlesitekit-frequency-selector__label-row">
								<Typography
									className="googlesitekit-frequency-selector__label"
									type="label"
									size="large"
									as="div"
								>
									{ label }
								</Typography>
							</div>

							<Typography
								className="googlesitekit-frequency-selector__period"
								type="body"
								size="small"
								as="div"
							>
								{ period }
							</Typography>

							<Typography
								className="googlesitekit-frequency-selector__description"
								type="body"
								size="small"
								as="div"
							>
								{ description }
							</Typography>
						</div>
					);
				} ) }
			</div>
		</Fragment>
	);
}

FrequencySelector.propTypes = {
	isUserSubscribed: PropTypes.bool,
};
