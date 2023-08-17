/**
 * TourTooltip stories.
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
import { storiesOf } from '@storybook/react';
import fetchMock from 'fetch-mock';

/**
 * WordPress dependencies
 */
import { createInterpolateElement } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { Button } from 'googlesitekit-components';
import Link from '../assets/js/components/Link';
import TourTooltips from '../assets/js/components/TourTooltips';
import { CORE_USER } from '../assets/js/googlesitekit/datastore/user/constants';
import { WithTestRegistry } from '../tests/js/utils';
import { CORE_UI } from '../assets/js/googlesitekit/datastore/ui/constants';
const { useDispatch } = Data;

// Create Mock WP Dashboard component to decouple tests to prevent future false negative.
const MockWPDashboard = () => (
	<div className="googlesitekit-wp-dashboard">
		<div className="googlesitekit-wp-dashboard__cta">
			<a
				className="googlesitekit-cta-link googlesitekit-wp-dashboard__cta-link"
				href="https://example.com/wp-admin/admin.php?page=googlesitekit-dashboard"
			>
				Visit your Site Kit Dashboard
			</a>
		</div>
		<div className="googlesitekit-wp-dashboard-stats googlesitekit-wp-dashboard-stats--fourup">
			<div
				className="googlesitekit-data-block googlesitekit-wp-dashboard-stats__data-table overview-total-users googlesitekit-data-block--default"
				tabIndex="-1"
			>
				<div className="step-1 googlesitekit-data-block__title-datapoint-wrapper">
					<h3 className=" googlesitekit-subheading-1 googlesitekit-data-block__title ">
						Total Unique Visitors
					</h3>
					<div className="googlesitekit-data-block__datapoint">
						11K
					</div>
				</div>
				<div className="googlesitekit-data-block__change-source-wrapper">
					<div className="googlesitekit-data-block__change">
						<span className="googlesitekit-data-block__arrow">
							<svg
								className="googlesitekit-change-arrow googlesitekit-change-arrow--up"
								width="9"
								height="9"
								viewBox="0 0 10 10"
								fill="none"
								xmlns="http://www.w3.org/2000/svg"
							>
								<path
									d="M5.625 10L5.625 2.375L9.125 5.875L10 5L5 -1.76555e-07L-2.7055e-07 5L0.875 5.875L4.375 2.375L4.375 10L5.625 10Z"
									fill="currentColor"
								></path>
							</svg>
						</span>
						<span className="googlesitekit-data-block__value">
							338.2%
						</span>
					</div>
				</div>
			</div>
			<div
				className="googlesitekit-data-block googlesitekit-wp-dashboard-stats__data-table overview-average-session-duration googlesitekit-data-block--default"
				tabIndex="-1"
			>
				<div className="googlesitekit-data-block__title-datapoint-wrapper">
					<h3 className=" googlesitekit-subheading-1 googlesitekit-data-block__title ">
						Avg. Time on Page
					</h3>
					<div className="googlesitekit-data-block__datapoint">
						11s
					</div>
				</div>
				<div className="googlesitekit-data-block__change-source-wrapper">
					<div className="googlesitekit-data-block__change">
						<span className="googlesitekit-data-block__arrow">
							<svg
								className="googlesitekit-change-arrow googlesitekit-change-arrow--up"
								width="9"
								height="9"
								viewBox="0 0 10 10"
								fill="none"
								xmlns="http://www.w3.org/2000/svg"
							>
								<path
									d="M5.625 10L5.625 2.375L9.125 5.875L10 5L5 -1.76555e-07L-2.7055e-07 5L0.875 5.875L4.375 2.375L4.375 10L5.625 10Z"
									fill="currentColor"
								></path>
							</svg>
						</span>
						<span className="googlesitekit-data-block__value">
							5.9%
						</span>
					</div>
				</div>
			</div>
			<div
				className="step-2 googlesitekit-data-block googlesitekit-wp-dashboard-stats__data-table overview-total-impressions googlesitekit-data-block--default"
				tabIndex="-1"
			>
				<div className="googlesitekit-data-block__title-datapoint-wrapper">
					<h3 className=" googlesitekit-subheading-1 googlesitekit-data-block__title ">
						Total Impressions
					</h3>
					<div className="googlesitekit-data-block__datapoint">
						697
					</div>
				</div>
				<div className="googlesitekit-data-block__change-source-wrapper">
					<div className="googlesitekit-data-block__change">
						<span className="googlesitekit-data-block__arrow">
							<svg
								className="googlesitekit-change-arrow googlesitekit-change-arrow--up"
								width="9"
								height="9"
								viewBox="0 0 10 10"
								fill="none"
								xmlns="http://www.w3.org/2000/svg"
							>
								<path
									d="M5.625 10L5.625 2.375L9.125 5.875L10 5L5 -1.76555e-07L-2.7055e-07 5L0.875 5.875L4.375 2.375L4.375 10L5.625 10Z"
									fill="currentColor"
								></path>
							</svg>
						</span>
						<span className="googlesitekit-data-block__value">
							31.5%
						</span>
					</div>
				</div>
			</div>
			<div
				className="googlesitekit-data-block googlesitekit-wp-dashboard-stats__data-table overview-total-clicks googlesitekit-data-block--default"
				tabIndex="-1"
			>
				<div className="googlesitekit-data-block__title-datapoint-wrapper">
					<h3 className=" googlesitekit-subheading-1 googlesitekit-data-block__title ">
						Total Clicks
					</h3>
					<div className="googlesitekit-data-block__datapoint">
						220
					</div>
				</div>
				<div className="googlesitekit-data-block__change-source-wrapper">
					<div className="googlesitekit-data-block__change">
						<span className="googlesitekit-data-block__arrow">
							<svg
								className="googlesitekit-change-arrow googlesitekit-change-arrow--up"
								width="9"
								height="9"
								viewBox="0 0 10 10"
								fill="none"
								xmlns="http://www.w3.org/2000/svg"
							>
								<path
									d="M5.625 10L5.625 2.375L9.125 5.875L10 5L5 -1.76555e-07L-2.7055e-07 5L0.875 5.875L4.375 2.375L4.375 10L5.625 10Z"
									fill="currentColor"
								></path>
							</svg>
						</span>
						<span className="googlesitekit-data-block__value">
							70.5%
						</span>
					</div>
				</div>
			</div>
		</div>
		<div className="googlesitekit-search-console-widget">
			<h2 className="step-3 googlesitekit-search-console-widget__title">
				Top content over the last 28 days
			</h2>
			<div className="googlesitekit-table-overflow">
				<div className="googlesitekit-table-overflow__container">
					<div className="googlesitekit-table googlesitekit-table--with-list">
						<table className="googlesitekit-table__wrapper googlesitekit-table__wrapper--2-col">
							<thead className="googlesitekit-table__head">
								<tr className="googlesitekit-table__head-row">
									<th
										className="googlesitekit-table__head-item googlesitekit-table__head-item--primary"
										data-tooltip="Page Title"
									>
										Title
									</th>
									<th
										className="googlesitekit-table__head-item"
										data-tooltip="Pageviews"
									>
										Pageviews
									</th>
								</tr>
							</thead>
							<tbody className="googlesitekit-table__body">
								<tr className="googlesitekit-table__body-row">
									<td className="googlesitekit-table__body-item">
										<div className="googlesitekit-table__body-item-content">
											<a
												className="googlesitekit-cta-link googlesitekit-table__body-item-link"
												href="https://earthbound.com/wp-admin/admin.php?page=googlesitekit-dashboard&amp;permaLink=https%3A%2F%2Fearthbound.com%2F"
											>
												Earthbound – Updates from the
												edge of space…
											</a>
											<a
												className="googlesitekit-cta-link googlesitekit-table__body-item-url googlesitekit-cta-link--external"
												href="/"
												target="_blank"
												rel="noopener noreferrer"
												aria-label="/ (opens in a new tab)"
											>
												/
											</a>
										</div>
									</td>
									<td className="googlesitekit-table__body-item">
										<div className="googlesitekit-table__body-item-content">
											12,837
										</div>
									</td>
								</tr>
								<tr className="googlesitekit-table__body-row">
									<td className="googlesitekit-table__body-item">
										<div className="googlesitekit-table__body-item-content">
											<a
												className="googlesitekit-cta-link googlesitekit-table__body-item-link"
												href="https://earthbound.com/wp-admin/admin.php?page=googlesitekit-dashboard&amp;permaLink=https%3A%2F%2Fearthbound.com%2Fabout%2F"
											>
												About – Earthbound
											</a>
											<a
												className="googlesitekit-cta-link googlesitekit-table__body-item-url googlesitekit-cta-link--external"
												href="/about/"
												target="_blank"
												rel="noopener noreferrer"
												aria-label="/about/ (opens in a new tab)"
											>
												/about/
											</a>
										</div>
									</td>
									<td className="googlesitekit-table__body-item">
										<div className="googlesitekit-table__body-item-content">
											69
										</div>
									</td>
								</tr>
								<tr className="googlesitekit-table__body-row">
									<td className="googlesitekit-table__body-item">
										<div className="googlesitekit-table__body-item-content">
											<a
												className="step-4 googlesitekit-cta-link googlesitekit-table__body-item-link"
												href="https://earthbound.com/wp-admin/admin.php?page=googlesitekit-dashboard&amp;permaLink=https%3A%2F%2Fearthbound.com%2Fwordpress-websites%2F"
											>
												WordPress Websites – Earthbound
											</a>
											<a
												className="googlesitekit-cta-link googlesitekit-table__body-item-url googlesitekit-cta-link--external"
												href="/wordpress-websites/"
												target="_blank"
												rel="noopener noreferrer"
												aria-label="/wordpress-websites/ (opens in a new tab)"
											>
												/wordpress-websites/
											</a>
										</div>
									</td>
									<td className="googlesitekit-table__body-item">
										<div className="googlesitekit-table__body-item-content">
											54
										</div>
									</td>
								</tr>
								<tr className="googlesitekit-table__body-row">
									<td className="googlesitekit-table__body-item">
										<div className="googlesitekit-table__body-item-content">
											<a
												className="googlesitekit-cta-link googlesitekit-table__body-item-link"
												href="https://earthbound.com/wp-admin/admin.php?page=googlesitekit-dashboard&amp;permaLink=https%3A%2F%2Fearthbound.com%2Fwordpress-websites%2Fwordpress-programming%2F"
											>
												WordPress Programming &amp;
												Development – Earthbound
											</a>
											<a
												className="googlesitekit-cta-link googlesitekit-table__body-item-url googlesitekit-cta-link--external"
												href="/wordpress-websites/wordpress-programming/"
												target="_blank"
												rel="noopener noreferrer"
												aria-label="/wordpress-websites/wordpress-programming/ (opens in a new tab)"
											>
												/wordpress-websites/wordpress-programming/
											</a>
										</div>
									</td>
									<td className="googlesitekit-table__body-item">
										<div className="googlesitekit-table__body-item-content">
											27
										</div>
									</td>
								</tr>
								<tr className="googlesitekit-table__body-row">
									<td className="googlesitekit-table__body-item">
										<div className="googlesitekit-table__body-item-content">
											<a
												className="googlesitekit-cta-link googlesitekit-table__body-item-link"
												href="https://earthbound.com/wp-admin/admin.php?page=googlesitekit-dashboard&amp;permaLink=https%3A%2F%2Fearthbound.com%2Fcategory%2Fwordpress%2F"
											>
												WordPress – Earthbound
											</a>
											<a
												className="googlesitekit-cta-link googlesitekit-table__body-item-url googlesitekit-cta-link--external"
												href="/category/wordpress/"
												target="_blank"
												rel="noopener noreferrer"
												aria-label="/category/wordpress/ (opens in a new tab)"
											>
												/category/wordpress/
											</a>
										</div>
									</td>
									<td className="googlesitekit-table__body-item">
										<div className="googlesitekit-table__body-item-content">
											20
										</div>
									</td>
								</tr>
							</tbody>
						</table>
					</div>
				</div>
			</div>
		</div>
	</div>
);

const TourControls = () => {
	const { receiveGetDismissedTours } = useDispatch( CORE_USER );
	const { setValue } = useDispatch( CORE_UI );
	const reset = () => {
		receiveGetDismissedTours( [] );
		setValue( 'feature-step', 0 );
	};

	return (
		<div style={ { textAlign: 'right' } }>
			<Button onClick={ reset }>Reset Dismissed Tours</Button>
		</div>
	);
};

storiesOf( 'Global', module ).add( 'TourTooltips', () => {
	const steps = [
		{
			target: '.step-1',
			title: 'See where your visitors are coming from',
			content:
				'Click on a slice of the chart to see how it changed over time just for that source',
			placement: 'bottom-start',
		},
		{
			target: '.step-2',
			title: "It's now easier to see your site's traffic at a glance",
			content:
				'Check the trend graph to see how your traffic changed over time',
			placement: 'top-end',
		},
		{
			target: '.step-3',
			title: 'Check how your traffic changed since you last looked',
			content:
				'Select a time frame to see the comparison with the previous time period',
		},
		{
			target: '.step-4',
			title: 'Generic step title for the fourth step',
			content: (
				<div>
					{ createInterpolateElement(
						'This is the fourth step with an external link that should go to Google, <a>link.</a>',
						{
							a: <Link href="http://google.com" external />,
						}
					) }
				</div>
			),
		},
	];
	fetchMock.post( /^\/google-site-kit\/v1\/core\/user\/data\/dismiss-tour/, {
		body: JSON.stringify( [ 'feature' ] ),
		status: 200,
	} );
	const setupRegistry = ( registry ) => {
		registry.dispatch( CORE_USER ).receiveGetDismissedTours( [] );
	};

	return (
		<WithTestRegistry callback={ setupRegistry }>
			<TourControls />
			<MockWPDashboard />
			<TourTooltips
				steps={ steps }
				tourID="feature"
				gaEventCategory="storybook"
			/>
		</WithTestRegistry>
	);
} );
