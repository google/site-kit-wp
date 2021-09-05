<?php

class SettingsCest {

	public function _before( Search_ConsoleTester $I ) { // phpcs:ignore PSR2.Methods.MethodDeclaration.Underscore
		$I->login( 'admin', 'password' );
	}

	public function tryToTest( Search_ConsoleTester $I ) {
	}

}
