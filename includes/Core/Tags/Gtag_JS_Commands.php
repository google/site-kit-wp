<?php

namespace Google\Site_Kit\Core\Tags;

class Gtag_JS_Commands implements \IteratorAggregate {

	protected $commands = [];

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
