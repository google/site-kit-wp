<?php

namespace Google\Site_Kit\Core\Tags;

use WP_Error;

class Gtag {
	protected $calls = [];
	/**
	 * @var array
	 */
	private $allowed_commands;

	/**
	 * @param array $allowed_commands
	 */
	public function __construct( array $allowed_commands = null ) {
		$this->allowed_commands = $allowed_commands;
	}

	public function __invoke( ...$args ) {
		if ( count( $args ) < 2 ) {
			return new WP_Error(
				'invalid_gtag_call',
				__( 'The gtag command must be called with at least two arguments.', 'google-site-kit' )
			);
		}
		if (
			$this->allowed_commands
			&& ! in_array( $args[0], $this->allowed_commands, true )
		) {
			return new WP_Error(
				'disallowed_gtag_command',
				sprintf(
					// translators: %s the command name.
					__( 'The "%s" gtag command is not allowed on this instance.', 'google-site-kit' ),
					$args[0]
				)
			);
		}

		$this->calls[] = $args;

		return true;
	}

	public function has_calls() {
		return isset( $this->calls[0] );
	}

	public function get_calls() {
		return $this->calls;
	}
}
