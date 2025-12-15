<?php
/**
 * Class Google\Site_Kit\Core\Email_Reporting\Max_Execution_Limiter
 *
 * @package   Google\Site_Kit\Core\Email_Reporting
 * @copyright 2025 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Email_Reporting;

/**
 * Guards long-running email reporting tasks against timeouts.
 *
 * @since 1.167.0
 * @access private
 * @ignore
 */
class Max_Execution_Limiter {

	const DEFAULT_LIMIT = 30;

	/**
	 * Maximum execution time budget in seconds.
	 *
	 * @since 1.167.0
	 *
	 * @var int
	 */
	private $max_execution_time;

	/**
	 * Constructor.
	 *
	 * @since 1.167.0
	 *
	 * @param int $max_execution_time PHP max_execution_time value.
	 */
	public function __construct( $max_execution_time ) {
		$this->max_execution_time = ( $max_execution_time && $max_execution_time > 0 )
			? (int) $max_execution_time
			: self::DEFAULT_LIMIT;
	}

	/**
	 * Determines whether the worker should abort execution.
	 *
	 * @since 1.167.0
	 *
	 * @param int $initiator_timestamp Initial batch timestamp.
	 * @return bool True when either the runtime or 24h limit has been reached.
	 */
	public function should_abort( $initiator_timestamp ) {
		$now                 = microtime( true );
		$execution_deadline  = $this->execution_deadline();
		$initiator_deadline  = (int) $initiator_timestamp + DAY_IN_SECONDS;
		$runtime_budget_used = $execution_deadline > 0 && $now >= $execution_deadline;

		return $runtime_budget_used || $now >= $initiator_deadline;
	}

	/**
	 * Resolves the maximum execution budget in seconds.
	 *
	 * @since 1.167.0
	 *
	 * @return int Number of seconds allotted for execution.
	 */
	protected function resolve_budget_seconds() {
		return $this->max_execution_time;
	}

	/**
	 * Calculates the execution deadline timestamp.
	 *
	 * @since 1.167.0
	 *
	 * @return float Execution cutoff timestamp.
	 */
	private function execution_deadline() {
		$budget = $this->resolve_budget_seconds();

		if ( $budget <= 0 ) {
			return 0;
		}

		$start_time = defined( 'WP_START_TIMESTAMP' ) ? (float) WP_START_TIMESTAMP : microtime( true );

		return $start_time + $budget - 10;
	}
}
