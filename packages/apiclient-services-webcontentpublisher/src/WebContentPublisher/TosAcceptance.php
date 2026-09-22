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

namespace Google\Service\WebContentPublisher;

class TosAcceptance extends \Google\Model
{
  /**
   * Optional. Whether the user opted in to receive product updates and email
   * communications.
   *
   * @var bool
   */
  public $emailOptIn;
  /**
   * Optional. The name of the person who accepted the TOS.
   *
   * @var string
   */
  public $signer;
  /**
   * Optional. The job title or role of the signer.
   *
   * @var string
   */
  public $signerTitle;
  /**
   * Required. Whether the user has accepted the Terms of Service.
   *
   * @var bool
   */
  public $userAccepted;

  /**
   * Optional. Whether the user opted in to receive product updates and email
   * communications.
   *
   * @param bool $emailOptIn
   */
  public function setEmailOptIn($emailOptIn)
  {
    $this->emailOptIn = $emailOptIn;
  }
  /**
   * @return bool
   */
  public function getEmailOptIn()
  {
    return $this->emailOptIn;
  }
  /**
   * Optional. The name of the person who accepted the TOS.
   *
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
   * Optional. The job title or role of the signer.
   *
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
   * Required. Whether the user has accepted the Terms of Service.
   *
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

// Adding a class alias for backwards compatibility with the previous class name.
class_alias(TosAcceptance::class, 'Google_Service_WebContentPublisher_TosAcceptance');
