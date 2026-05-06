import React, { useState } from 'react';
import { VotingTab } from './_types';

import DestinationVotingScreen from './DestinationVotingScreen';
import DateVotingScreen from './DateVotingScreen';
import BudgetVotingScreen from './BudgetVotingScreen';
import BudgetConflictScreen from './BudgetConflictScreen';

const BUDGET_HAS_CONFLICT = true;

interface VotingScreenProps {
  tripName?: string;
  timeLeft?: string;
  initialTab?: VotingTab;
  hasBudgetConflict?: boolean;
  onBack?: () => void;
  onFinishVoting?: () => void;
  onEndVoting?: () => void;
}

const VotingScreen: React.FC<VotingScreenProps> = ({
  tripName = 'Summer Europe Trip',
  timeLeft = '2d left',
  initialTab = 'Destinations',
  hasBudgetConflict = BUDGET_HAS_CONFLICT,
  onBack,
  onFinishVoting,
  onEndVoting,
}) => {
  const [activeTab, setActiveTab] = useState<VotingTab>(initialTab);

  const sharedProps = {
    tripName,
    timeLeft,
    onTabChange: setActiveTab,
    onBack,
  };

  switch (activeTab) {
    case 'Destinations':
      return <DestinationVotingScreen {...sharedProps} />;

    case 'Dates':
      return <DateVotingScreen {...sharedProps} />;

    case 'Budget':
      return hasBudgetConflict ? (
        <BudgetConflictScreen {...sharedProps} onEndVoting={onEndVoting} />
      ) : (
        <BudgetVotingScreen {...sharedProps} onFinishVoting={onFinishVoting} />
      );

    default:
      return <DestinationVotingScreen {...sharedProps} />;
  }
};

export default VotingScreen;