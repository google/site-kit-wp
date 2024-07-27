<?php

namespace Google\Site_Kit\Tests;

use Closure;
use Google\Site_Kit\Core\Guards\Guard_Interface;

class TestGuard implements Guard_Interface {

	private Closure $implementation;

	public function __construct( Closure $can_activate ) {
		$this->implementation = $can_activate;
	}

	public function can_activate() {
		return ( $this->implementation )();
	}
}
