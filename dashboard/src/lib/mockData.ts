export type StageStatus = 'pending' | 'in-progress' | 'completed';

export interface BoxEvent {
  title: string;
  description: string;
  timestamp: string;
  riskLevel?: 'low' | 'medium' | 'high';
  actor?: string;
  location?: string;
}

export interface SupplyChainStage {
  id: string;
  name: string;
  status: StageStatus;
  timestamp?: string;
  location?: string;
  description: string;
}

export interface BatchData {
  batchId: string;
  productName: string;
  origin: string;
  producer: string;
  harvestDate: string;
  algorandTxId: string;
  status: 'Complete' | 'In Progress';
  certifier: string;
  stages: SupplyChainStage[];
  aiRiskEvents: BoxEvent[];
}

export const getMockBatchData = (batchId: string): BatchData | null => {
  // Return null simulating "not found" if it doesn't match our demo mock ID
  const isDemo = batchId === 'batch-12345' || batchId === 'demo';

  if (!isDemo) return null;

  return {
    batchId: 'B-12345-ALG',
    productName: 'Premium Reserve Arabica Coffee',
    origin: 'Antioquia, Colombia',
    producer: 'Finca El Paraiso',
    harvestDate: '2025-10-15T08:00:00Z',
    algorandTxId: 'G3T45Y6U7I8O9P0A1S2D3F4G5H6J7K8L9Z0X1C2V3B4N5M6Q7W8E9R',
    status: 'Complete',
    certifier: 'FairTrade International verified by Algorand',
    stages: [
      {
        id: 'stage-1',
        name: 'Harvest & Sorting',
        status: 'completed',
        timestamp: '2025-10-15T14:30:00Z',
        location: 'Finca El Paraiso, Colombia',
        description: 'Cherries harvested and sorted for optimal ripeness.',
      },
      {
        id: 'stage-2',
        name: 'Washing & Fermentation',
        status: 'completed',
        timestamp: '2025-10-17T09:15:00Z',
        location: 'Finca El Paraiso Processing Facility',
        description: 'Washed and fermented for 48 hours to develop profile.',
      },
      {
        id: 'stage-3',
        name: 'Drying & Milling',
        status: 'completed',
        timestamp: '2025-10-25T11:00:00Z',
        location: 'Medellín Dry Mill',
        description: 'Air-dried to 11% moisture and milled to green beans.',
      },
      {
        id: 'stage-4',
        name: 'Export & Shipping',
        status: 'completed',
        timestamp: '2025-11-05T08:45:00Z',
        location: 'Port of Cartagena, Colombia -> Port of Seattle, USA',
        description: 'Packed in GrainPro bags and shipped via ocean freight.',
      },
      {
        id: 'stage-5',
        name: 'Roasting & Packaging',
        status: 'completed',
        timestamp: '2025-12-01T10:30:00Z',
        location: 'Seattle Roastery, WA',
        description: 'Roasted to medium-light profile and nitrogen sealed.',
      }
    ],
    aiRiskEvents: [
      {
        title: 'Temperature Anomaly Detected',
        description: 'Container temperature spiked above 25°C for 3 hours during transit. Quality assessment run and passed.',
        timestamp: '2025-11-12T15:20:00Z',
        riskLevel: 'medium',
        location: 'Transit Location: Caribbean Sea',
      },
      {
        title: 'Minor Delay Logged',
        description: 'Customs clearance delayed by 48 hours. No impact on product integrity.',
        timestamp: '2025-11-20T09:00:00Z',
        riskLevel: 'low',
        location: 'Port of Seattle',
      }
    ]
  };
};
