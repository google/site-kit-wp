<?php
/*
 * Copyright 2014 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License. You may obtain a copy of
 * the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 */

namespace Google\Service\Webcontentpublisher;

class TosAcceptance extends \Google\Model
{
  /**
   * The name of the person who accepted the terms.
   *
   * @var string
   */
  public $signer;
  /**
   * The job title or role of the signer.
   *
   * @var string
   */
  public $signerTitle;
  /**
   * Whether the user accepted the terms.
   *
   * @var bool
   */
  public $userAccepted;

  /**
   * @param string $signer
   */
  public function setSigner($signer)
  {
    $this->signer = $signer;
  }
  /**
   * @return string
   */
  public function getSigner()
  {
    return $this->signer;
  }
  /**
   * @param string $signerTitle
   */
  public function setSignerTitle($signerTitle)
  {
    $this->signerTitle = $signerTitle;
  }
  /**
   * @return string
   */
  public function getSignerTitle()
  {
    return $this->signerTitle;
  }
  /**
   * @param bool $userAccepted
   */
  public function setUserAccepted($userAccepted)
  {
    $this->userAccepted = $userAccepted;
  }
  /**
   * @return bool
   */
  public function getUserAccepted()
  {
    return $this->userAccepted;
  }
}

class_alias(TosAcceptance::class, 'Google_Service_Webcontentpublisher_TosAcceptance');
