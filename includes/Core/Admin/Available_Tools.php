<?php
/**
 * Class Google\Site_Kit\Core\Admin\Available_Tools
 *
 * @package   Google\Site_Kit\Core\Admin
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */
 
namespace Google\Site_Kit\Core\Admin;

use Google\Site_Kit\Core\Permissions\Permissions;
use Google\Site_Kit\Core\Util\Method_Proxy_Trait;
use Google\Site_Kit\Core\Util\Reset;
use Google\Site_Kit\Core\Util\Date;
use Google\Site_Kit\Context;
use Google\Site_Kit\Modules\Analytics_4;
use Google\Site_Kit\Modules\Search_Console;
use Google\Site_Kit\Modules\AdSense;
use WP_Error;

/**
 * Class for extending available tools for Site Kit.
 *
 * @since 1.30.0
 * @access private
 * @ignore
 */
class Available_Tools {
	use Method_Proxy_Trait;

	/**
	 * Cron action hook for the email report test.
	 */
	const CRON_ACTION = 'googlesitekit_email_report_test_cron';

	/**
	 * Transient key for storing last run log.
	 */
	const LOG_TRANSIENT = 'googlesitekit_email_report_test_log';

	/**
	 * Option key for last scheduled time.
	 */
	const LAST_SCHEDULED_OPTION = 'googlesitekit_email_report_test_last_scheduled';

	/**
	 * Registers functionality through WordPress hooks.
	 *
	 * @since 1.30.0
	 */
	public function register() {
		add_action( 'tool_box', $this->get_method_proxy( 'render_tool_box' ) );

		// Admin-post handler to schedule the single-run cron.
		add_action( 'admin_post_googlesitekit_schedule_email_report_test', $this->get_method_proxy( 'handle_schedule_email_report_test' ) );

		// Cron action handler.
		add_action( self::CRON_ACTION, $this->get_method_proxy( 'run_email_report_test_cron' ) );
	}

	/**
	 * Renders tool box output.
	 *
	 * @since 1.30.0
	 */
	private function render_tool_box() {
		if ( ! current_user_can( Permissions::SETUP ) ) {
			return;
		}

		$next_scheduled_ts = wp_next_scheduled( self::CRON_ACTION );
		$last_scheduled    = get_option( self::LAST_SCHEDULED_OPTION );
		$log               = get_transient( self::LOG_TRANSIENT );

		// Build schedule URL for 1-minute schedule.
		$schedule_url = wp_nonce_url(
			admin_url( 'admin-post.php?action=googlesitekit_schedule_email_report_test' ),
			'googlesitekit_email_report_test'
		);
		?>
		<div class="card">
			<h2 class="title"><?php esc_html_e( 'Reset Site Kit', 'google-site-kit' ); ?></h2>
			<p>
				<?php
				esc_html_e(
					'Resetting will disconnect all users and remove all Site Kit settings and data within WordPress. You and any other users who wish to use Site Kit will need to reconnect to restore access.',
					'google-site-kit'
				)
				?>
			</p>
			<p>
				<a
					class="button button-primary"
					href="<?php echo esc_url( Reset::url() ); ?>"
				>
					<?php esc_html_e( 'Reset Site Kit', 'google-site-kit' ); ?>
				</a>
			</p>
		</div>

		<div class="card">
			<h2 class="title"><?php esc_html_e( 'Email Report Test (Performance)', 'google-site-kit' ); ?></h2>
			<p>
				<?php
				echo esc_html__(
					'Schedules a one-off cron task to fetch Analytics 4, Search Console, and AdSense data for the last 28 days (including previous-period comparison), builds a simple HTML email, and sends it to the site admin email. This is for performance testing.',
					'google-site-kit'
				);
				?>
			</p>

			<ul>
				<li><?php esc_html_e( 'Coverage: Extended subset — GA4 total users + trend, top 3 channels, top 3 pages by pageviews, conversion breakdown (key events) + trend; SC totals + trend, SC top 3 queries; AdSense estimated earnings + trend (if connected).', 'google-site-kit' ); ?></li>
				<li><?php esc_html_e( 'Recipient: Site admin email (Settings → General).', 'google-site-kit' ); ?></li>
				<li><?php esc_html_e( 'Schedule: runs in ~1 minute.', 'google-site-kit' ); ?></li>
			</ul>

			<p>
				<a class="button button-primary" href="<?php echo esc_url( $schedule_url ); ?>">
					<?php esc_html_e( 'Schedule Email Report Test (Run in ~1 min)', 'google-site-kit' ); ?>
				</a>
			</p>

			<?php if ( $next_scheduled_ts ) : ?>
				<p>
					<strong><?php esc_html_e( 'Next scheduled run:', 'google-site-kit' ); ?></strong>
					<?php echo esc_html( gmdate( 'Y-m-d H:i:s', $next_scheduled_ts ) ); ?> UTC
				</p>
			<?php endif; ?>

			<?php if ( $last_scheduled ) : ?>
				<p>
					<strong><?php esc_html_e( 'Last scheduled at:', 'google-site-kit' ); ?></strong>
					<?php echo esc_html( gmdate( 'Y-m-d H:i:s', (int) $last_scheduled ) ); ?> UTC
				</p>
			<?php endif; ?>

			<?php if ( ! empty( $log ) && is_array( $log ) ) : ?>
				<hr />
				<h3><?php esc_html_e( 'Last run log (timings)', 'google-site-kit' ); ?></h3>
				<pre style="max-height: 240px; overflow:auto; background:#f6f7f7; padding:12px; border:1px solid #ccd0d4;"><?php echo esc_html( wp_json_encode( $log, JSON_PRETTY_PRINT ) ); ?></pre>
			<?php endif; ?>
		</div>
		<?php
	}

	/**
	 * Handles admin-post request to schedule the email report test cron.
	 */
	private function handle_schedule_email_report_test() {
		if ( ! current_user_can( Permissions::SETUP ) ) {
			wp_die( esc_html__( 'Insufficient permissions.', 'google-site-kit' ) );
		}

		check_admin_referer( 'googlesitekit_email_report_test' );

		// Schedule to run in ~1 minute.
		wp_schedule_single_event( time() + MINUTE_IN_SECONDS, self::CRON_ACTION );

		update_option( self::LAST_SCHEDULED_OPTION, time(), false );

		wp_safe_redirect( admin_url( 'tools.php' ) );
		exit;
	}

	/**
	 * Cron callback: runs the data fetch, email generation/sending, and timing log.
	 */
	private function run_email_report_test_cron() {
		$log = array(
			'started_at' => microtime( true ),
			'steps'      => array(),
		);

		$site_admin_email = get_option( 'admin_email' );
		$context          = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );

		// Helper to time a step.
		$time_step = function ( $name, $callable ) use ( &$log ) {
			$step_start = microtime( true );
			$result     = null;
			$error      = null;
			try {
				$result = $callable();
			} catch ( \Throwable $t ) {
				$error = $t->getMessage();
			}
			$log['steps'][] = array(
				'step'        => $name,
				'duration_ms' => ( microtime( true ) - $step_start ) * 1000.0,
				'error'       => $error,
			);
			return $result;
		};

		// Compute date ranges (current and previous 28 days). Search Console is offset by 2 days by default in Site Kit utilities.
		list( $ga_start, $ga_end )       = Date::parse_date_range( 'last-28-days', 1, 1, false );
		list( $ga_prev_start, $ga_prev_end ) = Date::parse_date_range( 'last-28-days', 1, 1, true );
		list( $sc_start, $sc_end )       = Date::parse_date_range( 'last-28-days', 1, 2, false );
		list( $sc_prev_start, $sc_prev_end ) = Date::parse_date_range( 'last-28-days', 1, 2, true );

		// Prepare containers for data.
		$data = array(
			'ga4' => array(),
			'sc'  => array(),
			'ads' => array(),
		);

		// Resolve module owners and switch user for authenticated requests.
		$analytics_owner_id = 0;
		$adsense_owner_id   = 0;
		$sc_owner_id        = 0;

		$owners = $time_step(
			'resolve_module_owners',
			function () use ( $context, &$analytics_owner_id, &$adsense_owner_id, &$sc_owner_id ) {
				$tmp_ga = new Analytics_4( $context );
				$tmp_sc = new Search_Console( $context );
				$tmp_ad = new AdSense( $context );

				if ( method_exists( $tmp_ga, 'get_owner_id' ) ) {
					$analytics_owner_id = (int) $tmp_ga->get_owner_id();
				}
				if ( method_exists( $tmp_sc, 'get_owner_id' ) ) {
					$sc_owner_id = (int) $tmp_sc->get_owner_id();
				}
				if ( method_exists( $tmp_ad, 'get_owner_id' ) ) {
					$adsense_owner_id = (int) $tmp_ad->get_owner_id();
				}

				return array(
					'ga4_owner' => $analytics_owner_id,
					'sc_owner'  => $sc_owner_id,
					'ads_owner' => $adsense_owner_id,
				);
			}
		);

		$prev_user = get_current_user_id();

		// GA4 block.
		$time_step(
			'ga4_fetch',
			function () use ( $context, $analytics_owner_id, $ga_start, $ga_end, $ga_prev_start, $ga_prev_end, &$data ) {
				if ( $analytics_owner_id > 0 ) {
					wp_set_current_user( $analytics_owner_id );
				}
				$ga = new Analytics_4( $context );

				if ( ! $ga->is_connected() ) {
					$data['ga4']['connected'] = false;
					return null;
				}

				$data['ga4']['connected'] = true;

				// Key events list (conversion breakdown).
				$key_events_resp = $ga->get_data( 'key-events', array() );
				$key_event_names = array();
				if ( ! is_wp_error( $key_events_resp ) && is_array( $key_events_resp ) ) {
					foreach ( $key_events_resp as $evt ) {
						$name = is_array( $evt ) && isset( $evt['eventName'] ) ? $evt['eventName'] : ( method_exists( $evt, 'getEventName' ) ? $evt->getEventName() : '' );
						if ( $name ) {
							$key_event_names[] = $name;
						}
					}
				}

				// GA4 totals: totalUsers for current and previous.
				$ga_totals_curr = $ga->get_data(
					'report',
					array(
						'metrics'   => array( 'totalUsers' ),
						'startDate' => $ga_start,
						'endDate'   => $ga_end,
						'limit'     => 1,
					)
				);
				$ga_totals_prev = $ga->get_data(
					'report',
					array(
						'metrics'   => array( 'totalUsers' ),
						'startDate' => $ga_prev_start,
						'endDate'   => $ga_prev_end,
						'limit'     => 1,
					)
				);

				$data['ga4']['totals'] = array(
					'current'  => self::ga4_sum_metric_from_response( $ga_totals_curr, 'totalUsers' ),
					'previous' => self::ga4_sum_metric_from_response( $ga_totals_prev, 'totalUsers' ),
				);

				// Top 3 channels by sessions.
				$ga_channels = $ga->get_data(
					'report',
					array(
						'dimensions' => array( 'sessionDefaultChannelGroup' ),
						'metrics'    => array( 'sessions' ),
						'startDate'  => $ga_start,
						'endDate'    => $ga_end,
						'limit'      => 10,
						'orderby'    => array(
							array(
								'metric'    => array( 'metricName' => 'sessions' ),
								'desc'      => true,
							),
						),
					)
				);
				$data['ga4']['top_channels'] = self::ga4_top_dimension_rows( $ga_channels, 'sessionDefaultChannelGroup', 'sessions', 3 );

				// Top 3 pages by pageviews (screenPageViews).
				$ga_pages = $ga->get_data(
					'report',
					array(
						'dimensions' => array( 'pagePath' ),
						'metrics'    => array( 'screenPageViews' ),
						'startDate'  => $ga_start,
						'endDate'    => $ga_end,
						'limit'      => 10,
						'orderby'    => array(
							array(
								'metric' => array( 'metricName' => 'screenPageViews' ),
								'desc'   => true,
							),
						),
					)
				);
				$data['ga4']['top_pages'] = self::ga4_top_dimension_rows( $ga_pages, 'pagePath', 'screenPageViews', 3 );

				// Conversion breakdown (key events) + trend using eventCount filtered per eventName.
				$conv = array();
				foreach ( array_slice( $key_event_names, 0, 10 ) as $event_name ) {
					$curr = $ga->get_data(
						'report',
						array(
							'dimensions'       => array( 'eventName' ),
							'metrics'          => array( 'eventCount' ),
							'startDate'        => $ga_start,
							'endDate'          => $ga_end,
							'limit'            => 1,
							'dimensionFilters' => array(
								'eventName' => array(
									'filterType' => 'stringFilter',
									'value'      => array(
										'matchType' => 'EXACT',
										'value'     => $event_name,
									),
								),
							),
						)
					);
					$prev = $ga->get_data(
						'report',
						array(
							'dimensions'       => array( 'eventName' ),
							'metrics'          => array( 'eventCount' ),
							'startDate'        => $ga_prev_start,
							'endDate'          => $ga_prev_end,
							'limit'            => 1,
							'dimensionFilters' => array(
								'eventName' => array(
									'filterType' => 'stringFilter',
									'value'      => array(
										'matchType' => 'EXACT',
										'value'     => $event_name,
									),
								),
							),
						)
					);
					$curr_val = self::ga4_sum_metric_from_response( $curr, 'eventCount' );
					$prev_val = self::ga4_sum_metric_from_response( $prev, 'eventCount' );
					$conv[]   = array(
						'event'    => $event_name,
						'current'  => $curr_val,
						'previous' => $prev_val,
						'delta'    => self::delta_pct( $prev_val, $curr_val ),
					);
				}
				$data['ga4']['conversions'] = $conv;

				return null;
			}
		);

		// Search Console block.
		$time_step(
			'search_console_fetch',
			function () use ( $context, $sc_owner_id, $sc_start, $sc_end, $sc_prev_start, $sc_prev_end, &$data ) {
				if ( $sc_owner_id > 0 ) {
					wp_set_current_user( $sc_owner_id );
				}
				$sc = new Search_Console( $context );

				if ( ! $sc->is_connected() ) {
					$data['sc']['connected'] = false;
					return null;
				}
				$data['sc']['connected'] = true;

				// Totals current and previous (no dimensions).
				$sc_curr = $sc->get_data(
					'searchanalytics',
					array(
						'startDate' => $sc_start,
						'endDate'   => $sc_end,
					)
				);
				$sc_prev = $sc->get_data(
					'searchanalytics',
					array(
						'startDate' => $sc_prev_start,
						'endDate'   => $sc_prev_end,
					)
				);

				$data['sc']['totals'] = array(
					'current'  => self::sc_totals( $sc_curr ),
					'previous' => self::sc_totals( $sc_prev ),
				);

				// Top 3 queries by clicks.
				$sc_queries = $sc->get_data(
					'searchanalytics',
					array(
						'startDate'  => $sc_start,
						'endDate'    => $sc_end,
						'dimensions' => array( 'query' ),
						'limit'      => 250,
					)
				);
				$rows = is_array( $sc_queries ) ? $sc_queries : array();
				usort(
					$rows,
					function ( $a, $b ) {
						$ac = isset( $a['clicks'] ) ? (float) $a['clicks'] : 0.0;
						$bc = isset( $b['clicks'] ) ? (float) $b['clicks'] : 0.0;
						return $bc <=> $ac;
					}
				);
				$data['sc']['top_queries'] = array_slice( $rows, 0, 3 );

				return null;
			}
		);

		// AdSense block.
		$time_step(
			'adsense_fetch',
			function () use ( $context, $adsense_owner_id, $ga_start, $ga_end, $ga_prev_start, $ga_prev_end, &$data ) {
				if ( $adsense_owner_id > 0 ) {
					wp_set_current_user( $adsense_owner_id );
				}
				$ad = new AdSense( $context );

				if ( ! $ad->is_connected() ) {
					$data['ads']['connected'] = false;
					return null;
				}
				$data['ads']['connected'] = true;

				$ads_curr = $ad->get_data(
					'report',
					array(
						'metrics'   => array( 'ESTIMATED_EARNINGS' ),
						'startDate' => $ga_start,
						'endDate'   => $ga_end,
						'limit'     => 0,
					)
				);
				$ads_prev = $ad->get_data(
					'report',
					array(
						'metrics'   => array( 'ESTIMATED_EARNINGS' ),
						'startDate' => $ga_prev_start,
						'endDate'   => $ga_prev_end,
						'limit'     => 0,
					)
				);

				$data['ads']['totals'] = array(
					'current'  => self::adsense_total_earnings( $ads_curr ),
					'previous' => self::adsense_total_earnings( $ads_prev ),
				);

				return null;
			}
		);

		// Generate HTML email.
		$email_html = $time_step(
			'email_render',
			function () use ( $data ) {
				ob_start();
				?>
				<div style="font-family:Arial,Helvetica,sans-serif; font-size:14px; color:#1f1f1f;">
					<h2>Site Kit Email Report (Performance Test)</h2>

					<?php if ( ! empty( $data['ga4']['connected'] ) ) : ?>
						<h3>Google Analytics 4</h3>
						<p><strong>Total Users (28d):</strong>
							<?php
							$curr = isset( $data['ga4']['totals']['current'] ) ? (float) $data['ga4']['totals']['current'] : 0.0;
							$prev = isset( $data['ga4']['totals']['previous'] ) ? (float) $data['ga4']['totals']['previous'] : 0.0;
							echo esc_html( number_format_i18n( $curr ) );
							echo ' (';
							echo esc_html( self::format_delta_pct( self::delta_pct( $prev, $curr ) ) );
							echo ')';
							?>
						</p>

						<?php if ( ! empty( $data['ga4']['top_channels'] ) ) : ?>
							<p><strong>Top Channels:</strong></p>
							<ol>
								<?php foreach ( $data['ga4']['top_channels'] as $row ) : ?>
									<li><?php echo esc_html( $row['dimension'] . ' — ' . number_format_i18n( $row['metric'] ) . ' sessions' ); ?></li>
								<?php endforeach; ?>
							</ol>
						<?php endif; ?>

						<?php if ( ! empty( $data['ga4']['top_pages'] ) ) : ?>
							<p><strong>Top Pages (by pageviews):</strong></p>
							<ol>
								<?php foreach ( $data['ga4']['top_pages'] as $row ) : ?>
									<li><?php echo esc_html( $row['dimension'] . ' — ' . number_format_i18n( $row['metric'] ) . ' views' ); ?></li>
								<?php endforeach; ?>
							</ol>
						<?php endif; ?>

						<?php if ( ! empty( $data['ga4']['conversions'] ) ) : ?>
							<p><strong>Conversion Breakdown (Key Events):</strong></p>
							<ul>
								<?php foreach ( $data['ga4']['conversions'] as $conv ) : ?>
									<li>
										<?php
										echo esc_html(
											sprintf(
												'%s — %s (Δ %s)',
												$conv['event'],
												number_format_i18n( (float) $conv['current'] ),
												self::format_delta_pct( $conv['delta'] )
											)
										);
										?>
									</li>
								<?php endforeach; ?>
							</ul>
						<?php endif; ?>
					<?php endif; ?>

					<?php if ( ! empty( $data['sc']['connected'] ) ) : ?>
						<h3>Google Search Console</h3>
						<?php
						$sc_c = isset( $data['sc']['totals']['current'] ) ? $data['sc']['totals']['current'] : array( 'clicks' => 0, 'impressions' => 0 );
						$sc_p = isset( $data['sc']['totals']['previous'] ) ? $data['sc']['totals']['previous'] : array( 'clicks' => 0, 'impressions' => 0 );
						?>
						<p><strong>Clicks (28d):</strong>
							<?php
							echo esc_html( number_format_i18n( (float) $sc_c['clicks'] ) );
							echo ' (';
							echo esc_html( self::format_delta_pct( self::delta_pct( (float) $sc_p['clicks'], (float) $sc_c['clicks'] ) ) );
							echo ')';
							?>
						</p>
						<p><strong>Impressions (28d):</strong>
							<?php
							echo esc_html( number_format_i18n( (float) $sc_c['impressions'] ) );
							echo ' (';
							echo esc_html( self::format_delta_pct( self::delta_pct( (float) $sc_p['impressions'], (float) $sc_c['impressions'] ) ) );
							echo ')';
							?>
						</p>

						<?php if ( ! empty( $data['sc']['top_queries'] ) ) : ?>
							<p><strong>Top Queries:</strong></p>
							<ol>
								<?php foreach ( $data['sc']['top_queries'] as $row ) : ?>
									<li>
										<?php
										$q = isset( $row['keys'][0] ) ? $row['keys'][0] : '';
										$c = isset( $row['clicks'] ) ? (float) $row['clicks'] : 0;
										$i = isset( $row['impressions'] ) ? (float) $row['impressions'] : 0;
										echo esc_html( sprintf( '%s — %s clicks, %s impressions', $q, number_format_i18n( $c ), number_format_i18n( $i ) ) );
										?>
									</li>
								<?php endforeach; ?>
							</ol>
						<?php endif; ?>
					<?php endif; ?>

					<?php if ( ! empty( $data['ads']['connected'] ) ) : ?>
						<h3>AdSense</h3>
						<?php
						$ad_c = isset( $data['ads']['totals']['current'] ) ? (float) $data['ads']['totals']['current'] : 0.0;
						$ad_p = isset( $data['ads']['totals']['previous'] ) ? (float) $data['ads']['totals']['previous'] : 0.0;
						?>
						<p><strong>Estimated earnings (28d):</strong>
							<?php
							echo esc_html( number_format_i18n( $ad_c, 2 ) );
							echo ' (';
							echo esc_html( self::format_delta_pct( self::delta_pct( $ad_p, $ad_c ) ) );
							echo ')';
							?>
						</p>
					<?php endif; ?>

					<hr />
					<p style="color:#6b6b6b;">This message was generated by Site Kit (Email Report Test).</p>
				</div>
				<?php
				return ob_get_clean();
			}
		);

		// Send email.
		$time_step(
			'email_send',
			function () use ( $site_admin_email, $email_html ) {
				$headers = array( 'Content-Type: text/html; charset=UTF-8' );
				wp_mail( $site_admin_email, 'Site Kit Email Report (Performance Test)', $email_html, $headers );
				return null;
			}
		);

		$log['finished_at']  = microtime( true );
		$log['total_ms']     = ( $log['finished_at'] - $log['started_at'] ) * 1000.0;

		set_transient( self::LOG_TRANSIENT, $log, 12 * HOUR_IN_SECONDS );

		// Restore previous user if changed.
		if ( $prev_user && ( get_current_user_id() !== $prev_user ) ) {
			wp_set_current_user( $prev_user );
		}
	}

	/**
	 * Helpers
	 */

	/**
	 * Compute percentage delta from previous to current.
	 *
	 * @param float|int $prev
	 * @param float|int $curr
	 * @return float Percentage delta in range (-inf, +inf) where 0 means no change.
	 */
	private static function delta_pct( $prev, $curr ) {
		$prev = (float) $prev;
		$curr = (float) $curr;
		if ( $prev == 0.0 ) {
			if ( $curr == 0.0 ) {
				return 0.0;
			}
			return 100.0; // From 0 to positive current — treat as +100%.
		}
		return ( ( $curr - $prev ) / $prev ) * 100.0;
	}

	/**
	 * Format percentage delta with sign and % symbol.
	 *
	 * @param float $delta
	 * @return string
	 */
	private static function format_delta_pct( $delta ) {
		$sign = $delta > 0 ? '+' : '';
		return $sign . number_format_i18n( $delta, 1 ) . '%';
	}

	/**
	 * Extract a total metric value from a GA4 report response.
	 *
	 * @param mixed  $response
	 * @param string $metric_name
	 * @return float
	 */
	private static function ga4_sum_metric_from_response( $response, $metric_name ) {
		// The GA4 response may be a Google service object with methods getRows()/getTotals* etc.
		if ( is_wp_error( $response ) || empty( $response ) ) {
			return 0.0;
		}

		$total = 0.0;

		// Prefer totals if available.
		if ( is_object( $response ) && method_exists( $response, 'getTotals' ) ) {
			$totals = $response->getTotals();
			if ( is_array( $totals ) && ! empty( $totals ) ) {
				// Try first total row's values.
				$metric_headers = method_exists( $response, 'getMetricHeaders' ) ? $response->getMetricHeaders() : array();
				$target_index   = null;
				if ( is_array( $metric_headers ) ) {
					foreach ( $metric_headers as $idx => $mh ) {
						$name = method_exists( $mh, 'getName' ) ? $mh->getName() : '';
						if ( $name === $metric_name ) {
							$target_index = $idx;
							break;
						}
					}
				}
				$first_total = $totals[0] ?? null;
				if ( $first_total && method_exists( $first_total, 'getMetricValues' ) && $target_index !== null ) {
					$mv = $first_total->getMetricValues();
					if ( isset( $mv[ $target_index ] ) && method_exists( $mv[ $target_index ], 'getValue' ) ) {
						return (float) $mv[ $target_index ]->getValue();
					}
				}
			}
		}

		// Fallback: sum from rows.
		if ( is_object( $response ) && method_exists( $response, 'getRows' ) ) {
			$rows           = $response->getRows();
			$metric_headers = method_exists( $response, 'getMetricHeaders' ) ? $response->getMetricHeaders() : array();
			$target_index   = null;
			if ( is_array( $metric_headers ) ) {
				foreach ( $metric_headers as $idx => $mh ) {
					$name = method_exists( $mh, 'getName' ) ? $mh->getName() : '';
					if ( $name === $metric_name ) {
						$target_index = $idx;
						break;
					}
				}
			}
			if ( is_array( $rows ) && $target_index !== null ) {
				foreach ( $rows as $row ) {
					if ( method_exists( $row, 'getMetricValues' ) ) {
						$mvs = $row->getMetricValues();
						if ( isset( $mvs[ $target_index ] ) && method_exists( $mvs[ $target_index ], 'getValue' ) ) {
							$total += (float) $mvs[ $target_index ]->getValue();
						}
					}
				}
			}
		}

		return $total;
	}

	/**
	 * Extract top N rows with a single dimension and single metric from GA4 response.
	 *
	 * @param mixed  $response
	 * @param string $dimension_name
	 * @param string $metric_name
	 * @param int    $limit
	 * @return array
	 */
	private static function ga4_top_dimension_rows( $response, $dimension_name, $metric_name, $limit = 3 ) {
		$out = array();
		if ( is_wp_error( $response ) || empty( $response ) ) {
			return $out;
		}
		if ( is_object( $response ) && method_exists( $response, 'getRows' ) ) {
			$rows = $response->getRows();
			if ( is_array( $rows ) ) {
				foreach ( $rows as $row ) {
					$dim_val = '';
					$met_val = 0.0;

					if ( method_exists( $row, 'getDimensionValues' ) ) {
						$dvs = $row->getDimensionValues();
						// If multiple dimensions are requested, we try to pick first as pagePath/sessionDefaultChannelGroup usage above.
						if ( is_array( $dvs ) && ! empty( $dvs ) && method_exists( $dvs[0], 'getValue' ) ) {
							$dim_val = $dvs[0]->getValue();
						}
					}
					if ( method_exists( $row, 'getMetricValues' ) ) {
						$mvs = $row->getMetricValues();
						if ( is_array( $mvs ) && ! empty( $mvs ) && method_exists( $mvs[0], 'getValue' ) ) {
							$met_val = (float) $mvs[0]->getValue();
						}
					}

					if ( $dim_val !== '' ) {
						$out[] = array(
							'dimension' => $dim_val,
							'metric'    => $met_val,
						);
					}
				}
			}
		}
		// Already ordered via orderBy; still ensure limited.
		return array_slice( $out, 0, $limit );
	}

	/**
	 * Extract totals from Search Console rows response.
	 *
	 * @param mixed $rows
	 * @return array{clicks:float,impressions:float}
	 */
	private static function sc_totals( $rows ) {
		$total_clicks     = 0.0;
		$total_impressions = 0.0;
		if ( is_array( $rows ) ) {
			foreach ( $rows as $r ) {
				$total_clicks      += isset( $r['clicks'] ) ? (float) $r['clicks'] : 0.0;
				$total_impressions += isset( $r['impressions'] ) ? (float) $r['impressions'] : 0.0;
			}
		}
		return array(
			'clicks'      => $total_clicks,
			'impressions' => $total_impressions,
		);
	}

	/**
	 * Extract summed estimated earnings from AdSense report response.
	 *
	 * @param mixed $response
	 * @return float
	 */
	private static function adsense_total_earnings( $response ) {
		if ( is_wp_error( $response ) || empty( $response ) ) {
			return 0.0;
		}

		$total = 0.0;

		// Try getTotals (v2 may expose totals via getRows + totals). If not, sum over rows metric values.
		if ( is_object( $response ) && method_exists( $response, 'getTotals' ) ) {
			$totals = $response->getTotals();
			if ( is_array( $totals ) ) {
				foreach ( $totals as $t ) {
					if ( method_exists( $t, 'getMetricValues' ) ) {
						foreach ( (array) $t->getMetricValues() as $mv ) {
							// AdSense may use doubleValue/microsValue.
							if ( method_exists( $mv, 'getDoubleValue' ) && $mv->getDoubleValue() !== null ) {
								$total += (float) $mv->getDoubleValue();
							} elseif ( method_exists( $mv, 'getMicrosValue' ) && $mv->getMicrosValue() !== null ) {
								$total += ((float) $mv->getMicrosValue()) / 1000000.0;
							}
						}
					}
				}
				if ( $total > 0.0 ) {
					return $total;
				}
			}
		}

		if ( is_object( $response ) && method_exists( $response, 'getRows' ) ) {
			$rows = $response->getRows();
			if ( is_array( $rows ) ) {
				foreach ( $rows as $row ) {
					if ( method_exists( $row, 'getMetricValues' ) ) {
						foreach ( (array) $row->getMetricValues() as $mv ) {
							if ( method_exists( $mv, 'getDoubleValue' ) && $mv->getDoubleValue() !== null ) {
								$total += (float) $mv->getDoubleValue();
							} elseif ( method_exists( $mv, 'getMicrosValue' ) && $mv->getMicrosValue() !== null ) {
								$total += ((float) $mv->getMicrosValue()) / 1000000.0;
							}
						}
					}
				}
			}
		}

		return $total;
	}
}
