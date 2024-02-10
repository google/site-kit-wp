<?php

namespace Google\Site_Kit\Core\Tags;

class Gtag_JS_Command {
	/**
	 * @var string
	 */
	private $command;

	/**
	 * @var string
	 */
	private $subcommand;

	private $config = [];

	public function __construct( $command, $subcommand ) {
		$this->command = (string) $command;
		$this->subcommand = (string) $subcommand;
	}

	public function set( $key, $value ) {
		$this->config[ $key ] = $value;
	}

	public function to_array() {
		$cmd = [ $this->command ];

		if ( $this->subcommand ) {
			$cmd[] = $this->subcommand;
		}

		if ( $this->config ) {
			$cmd[] = $this->config;
		}

		return $cmd;
	}
}
