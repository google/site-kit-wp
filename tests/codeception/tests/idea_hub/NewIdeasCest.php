<?php

use Step\Idea_Hub\Widget as Widget_Tester;

class NewIdeasCest {

	private $ideas;

	public function _before( Idea_HubTester $I ) { // phpcs:ignore PSR2.Methods.MethodDeclaration.Underscore
		$this->ideas = include __DIR__ . '/../../plugins/idea-hub/new-ideas.php';

		$I->loginAsAdmin();
		$I->enableIdeaHubMocks();
		$I->connectSiteKit();
		$I->setupIdeaHub();
	}

	public function canSeeNewIdeas( Widget_Tester $I ) {
		$I->amOnDashboardPage();
		foreach ( $this->ideas as $idea ) {
			$I->seeIdeaText( $idea );
			$I->seeIdeaTopics( $idea );
		}
	}

	public function canCreateDraftPostForNewIdea( Widget_Tester $I ) {
		$idea = $this->ideas[ array_rand( $this->ideas ) ];

		$I->amOnDashboardPage();
		$I->canCreateDraftPost( $idea );
		$I->seeDraftedPost( $idea );
	}

}
