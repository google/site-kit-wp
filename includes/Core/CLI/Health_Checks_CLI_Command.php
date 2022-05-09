<?php
/**
 * Class Google\Site_Kit\Core\CLI\Health_Checks_CLI_Command
 *
 * @package   Google\Site_Kit\Core\CLI
 * @copyright 2022 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\CLI;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Authentication\Authentication;
use Google\Site_Kit\Core\Util\Health_Checks;
use WP_CLI\Formatter;

/**
 * Manages health checks.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
class Health_Checks_CLI_Command extends CLI_Command {

	/**
	 * Health Checks instance.
	 *
	 * @since n.e.x.t
	 * @var Health_Checks
	 */
	protected $health_checks;

	/**
	 * Constructor.
	 *
	 * @param Context $context Context instance.
	 */
	public function __construct( Context $context ) {
		parent::__construct( $context );

		$authentication      = new Authentication( $context );
		$this->health_checks = new Health_Checks( $authentication );
	}

	/**
	 * Runs all checks.
	 *
	 * @param array $args Array of arguments.
	 * @param array $assoc_args Array of associated arguments.
	 */
	public function run_all( $args, $assoc_args ) {
		$results = $this->health_checks->run_all();

		$results = array_map(
			function ( $result, $check_id ) {
				return array(
					'name'   => $check_id,
					'result' => $result['pass'] ? 'pass' : 'fail',
					'error'  => $result['errorMsg'],
				);
			},
			$results,
			array_keys( $results )
		);

		$formatter = new Formatter( $assoc_args, array( 'name', 'result', 'error' ) );
		$formatter->display_items( $results );
	}
}
