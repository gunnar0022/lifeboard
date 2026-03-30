import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useApi } from '../../../hooks/useApi';
import CampaignCard from './CampaignCard';
import CampaignCreateEdit from './CampaignCreateEdit';
import CharacterList from './CharacterList';
import { CLASS_COLORS } from './dndUtils';

export default function DnDSelectionScreen({ onSelectCharacter }) {
  const { data: campaigns, refetch: refetchCampaigns } = useApi('/api/dnd/campaigns');
  const { data: characters, refetch: refetchCharacters } = useApi('/api/dnd/characters');
  const [selectedCampaign, setSelectedCampaign] = useState(null); // null = not chosen yet, 'skip' = no campaign
  const [creating, setCreating] = useState(false);

  const campaignChosen = selectedCampaign !== null;
  const campaignId = selectedCampaign === 'skip' ? null : selectedCampaign;
  const selectedCampaignObj = campaigns?.find(c => c.id === selectedCampaign);

  const handleSelectCampaign = (id) => {
    setSelectedCampaign(prev => prev === id ? null : id); // Toggle selection
  };

  const handleCampaignCreated = (campaign) => {
    setCreating(false);
    refetchCampaigns();
    setSelectedCampaign(campaign.id);
  };

  const handleSelectCharacter = (id, editMode) => {
    onSelectCharacter(id, editMode, campaignId);
  };

  return (
    <div className="dnd-selection">
      {/* Campaigns Section */}
      <div className="dnd-selection__section">
        <div className="dnd-selection__section-header">
          <h3 className="dnd-section-title">Campaigns</h3>
          {!creating && (
            <button className="dnd-add-btn" onClick={() => setCreating(true)}>
              <Plus size={14} /> New Campaign
            </button>
          )}
        </div>

        <div className="dnd-selection__campaign-grid">
          {creating && (
            <CampaignCreateEdit
              onCreated={handleCampaignCreated}
              onCancel={() => setCreating(false)}
            />
          )}
          {(campaigns || []).map(c => (
            <CampaignCard
              key={c.id}
              campaign={c}
              isSelected={selectedCampaign === c.id}
              onSelect={handleSelectCampaign}
              onRefresh={refetchCampaigns}
            />
          ))}
        </div>

        {!creating && (
          <button
            className={`dnd-selection__skip ${selectedCampaign === 'skip' ? 'dnd-selection__skip--active' : ''}`}
            onClick={() => setSelectedCampaign(prev => prev === 'skip' ? null : 'skip')}
          >
            {selectedCampaign === 'skip' ? 'Campaign skipped' : 'Skip \u2014 no campaign'}
          </button>
        )}
      </div>

      {/* Characters Section */}
      {campaignChosen && (
        <div className="dnd-selection__section dnd-selection__section--characters">
          <div className="dnd-selection__section-header">
            <h3 className="dnd-section-title">Characters</h3>
            {selectedCampaignObj && (
              <span className="dnd-selection__context">
                for: <strong>{selectedCampaignObj.name}</strong>
              </span>
            )}
          </div>
          <CharacterList
            characters={characters || []}
            onSelect={handleSelectCharacter}
            onRefresh={refetchCharacters}
          />
        </div>
      )}
    </div>
  );
}
