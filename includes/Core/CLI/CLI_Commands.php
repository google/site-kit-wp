<?php
/**
 * Class Google\Site_Kit\Core\CLI\CLI_Commands
 *
 * @package   Google\Site_Kit\Core\CLI
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\CLI;

use Google\Site_Kit\Context;
use WP_CLI;

/**
 * CLI commands hub class.
 *
 * @since 1.11.0
 * @access private
 * @ignore
 */
class CLI_Commands {

	const COMMAND_MAP = array(
		'auth'                => Authentication_CLI_Command::class,
		'auth scopes'         => Auth_Scopes_CLI_Command::class,
		'auth token'          => Auth_Token_CLI_Command::class,
		'features'            => Feature_Flags_CLI_Command::class,
		'health-checks'       => Health_Checks_CLI_Command::class,
		'module'              => Module_CLI_Command::class,
		'module data'         => Module_Data_CLI_Command::class,
		'module datapoint'    => Module_Datapoint_CLI_Command::class,
		'reset'               => Reset_CLI_Command::class,
		'search-console site' => Search_Console_Site_CLI_Command::class,
		'site credentials'    => Site_Credentials_CLI_Command::class,
		'site fields'         => Site_Fields_CLI_Command::class,
		'site verification'   => Site_Verification_CLI_Command::class,
	);

	/**
	 * Plugin context.
	 *
	 * @since 1.11.0
	 *
	 * @var Context
	 */
	private $context;

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
	 * Registers WP CLI commands.
	 *
	 * @since 1.11.0
	 */
	public function register() {
		foreach ( self::COMMAND_MAP as $command => $command_class ) {
			$command_instance = new $command_class( $this->context );

			WP_CLI::add_command(
				"google-site-kit $command",
				$command_instance,
				array(
					'before_invoke' => array( $command_instance, '__before_invoke' )
				)
			);
		}
	}
}
