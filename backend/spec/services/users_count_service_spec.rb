require 'rails_helper'

RSpec.describe UsersCountService do
  describe '.snapshot' do
    it 'returns the total and role counts with timestamp' do
      snapshot = described_class.snapshot

      expect(snapshot[:total]).to eq(2)
      expect(snapshot[:admin]).to eq(1)
      expect(snapshot[:non_admin]).to eq(1)
      expect { Time.iso8601(snapshot[:updated_at]) }.not_to raise_error
    end
  end

  describe '.broadcast' do
    it 'broadcasts the snapshot on the users_count stream' do
      snapshot = { total: 0, admin: 0, non_admin: 0, updated_at: Time.current.iso8601 }
      allow(described_class).to receive(:snapshot).and_return(snapshot)
      allow(ActionCable.server).to receive(:broadcast)

      described_class.broadcast

      expect(ActionCable.server).to have_received(:broadcast).with(described_class.stream_name, snapshot)
    end
  end

  describe '.stream_name' do
    it 'returns the users_count stream name' do
      expect(described_class.stream_name).to eq('users_count')
    end
  end
end


