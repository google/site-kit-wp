<?php
/**
 * Site Kit CLI Command
 *
 * @package   Google\Site_Kit\Core\CLI
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\CLI;

use Google\Site_Kit\Context;
use WP_CLI_Command;

/**
 * Base CLI Command class.
 *
 * @since 1.11.0
 * @access private
 * @ignore
 */
class CLI_Command extends WP_CLI_Command {

	/**
	 * Plugin context.
	 *
	 * @since 1.11.0
	 *
	 * @var Context
	 */
	protected $context;

	/**
	 * Constructor.
	 *
	 * @since 1.11.0
	 *
	 * @param Context $context Plugin context.
	 */
	public function __construct( Context $context ) {
		$this->context = $context;
	}

	/**
	 * WP_CLI before_invoke lifecycle method.
	 *
	 * See \WP_CLI\Dispatcher\CommandFactory::is_good_method
	 */
	public function __before_invoke() {

	}
}
