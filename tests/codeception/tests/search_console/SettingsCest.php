<?php

class SettingsCest {

	public function _before( Search_ConsoleTester $I ) { // phpcs:ignore PSR2.Methods.MethodDeclaration.Underscore
		$I->loginAsAdmin();
		$I->connectSiteKit();
	}

	public function _after( Search_ConsoleTester $I ) { // phpcs:ignore PSR2.Methods.MethodDeclaration.Underscore
		$I->disconnectSiteKit();
	}

	public function tryToTestSettings( Search_ConsoleTester $I ) {
		$I->amOnSettingsPage();
	}

}
