<?php
/**
 * Site Kit CLI Command
 *
 * @package   Google\Site_Kit\Core\CLI
 * @copyright 2020 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\CLI;

use Google\Site_Kit\Context;
use WP_CLI_Command;

/**
 * Base CLI Command class.
 *
 * @since n.e.x.t
 */
class CLI_Command extends WP_CLI_Command {

	/**
	 * Plugin context.
	 *
	 * @since n.e.x.t
	 *
	 * @access protected
	 * @var \Google\Site_Kit\Context
	 */
	protected $context;

	/**
	 * Constructor.
	 *
	 * @since n.e.x.t
	 *
	 * @access public
	 * @param \Google\Site_Kit\Context $context Plugin context.
	 */
	public function __construct( Context $context ) {
		$this->context = $context;
	}

}
