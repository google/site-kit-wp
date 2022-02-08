<?php

namespace Google\Site_Kit\Core\CLI;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Authentication\Authentication;
use Google\Site_Kit\Core\Util\Health_Checks;
use WP_CLI\Formatter;

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
	 * @param Context $context
	 */
	public function __construct( Context $context ) {
		parent::__construct( $context );

		$authentication      = new Authentication( $context );
		$this->health_checks = new Health_Checks( $authentication );
	}

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
