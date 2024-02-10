<?php

namespace Google\Site_Kit\Core\Tags;

class Gtag_JS_Commands implements \IteratorAggregate {

	protected $commands = [];

	/**
	 * @var mixed|null
	 */
	private $allowed_commands;

	public function __construct( $allowed_commands = null ) {
		$this->allowed_commands = $allowed_commands;
	}

	public function add_command( Gtag_JS_Command $command ) {
		$this->commands[] = $command;
	}

	public function getIterator() {
		return new \ArrayIterator(
			$this->to_array()
		);
	}

	private function to_array() {
		return array_map(
			function ( Gtag_JS_Command $command ) {
				return $command->to_array();
			},
			$this->commands
		);
	}
}
